import asyncio
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
import chain
import main


class AppTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.data = Path(self.temp.name) / 'faqs.json'
        self.patch = patch.object(main, 'DATA_FILE', self.data)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.client = TestClient(main.app)
        self.faq = dict(id='1', question='Question?', answer='Answer', tags=[])

    @patch.dict(os.environ, {'ADMIN_PASSWORD': 'test-password'})
    def test_admin_validation_and_unicode_roundtrip(self):
        self.assertEqual(self.client.post('/api/faq', json=[]).status_code, 401)
        auth = ('admin', 'test-password')
        self.assertEqual(self.client.post('/api/faq', json=[{}], auth=auth).status_code, 422)
        self.assertEqual(self.client.post('/api/faq', json=[self.faq] * 2, auth=auth).status_code, 422)
        self.faq['answer'] = 'سلام </script><script>alert(1)</script>'
        self.assertEqual(self.client.post('/api/faq', json=[self.faq], auth=auth).status_code, 200)
        self.assertEqual(main.load_faqs()[0]['answer'], self.faq['answer'])
        self.assertNotIn(self.faq['answer'], self.client.get('/admin', auth=auth).text)

    def test_failed_replace_preserves_original(self):
        main.save_faqs([self.faq])
        with patch.object(main.os, 'replace', side_effect=OSError('disk error')):
            with self.assertRaises(OSError):
                main.save_faqs([])
        self.assertEqual(main.load_faqs(), [self.faq])

    def test_chat_failure_and_empty_message(self):
        self.assertEqual(self.client.post('/api/chat', json={'message': '   '}).status_code, 422)
        with patch.object(main, 'generate_reply', new=AsyncMock(side_effect=RuntimeError('secret'))):
            response = self.client.post('/api/chat', json={'message': 'Hello'})
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('secret', response.text)

    def test_citation_does_not_claim_first_candidate(self):
        other = dict(self.faq, id='2', answer='Second answer')
        candidates = [{'faq': self.faq}, {'faq': other}]
        fake = AsyncMock()
        fake.ainvoke.return_value.content = 'Second answer (source: FAQ)'
        with patch.object(chain, 'llm', fake):
            _, matched = asyncio.run(chain.generate_reply('question', candidates))
        self.assertEqual(matched, '2')

    def test_browser_scripts_parse(self):
        for name in ('index.html', 'admin.html'):
            html = main.render(name, faqs=json.dumps([self.faq]))
            script = html.split('<script>')[1].split('</script>')[0]
            result = subprocess.run(['node', '--check'], input=script, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == '__main__':
    unittest.main()
