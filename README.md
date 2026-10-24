# FAQ Chatbot

Python FAQ assistant with a FastAPI web interface, fuzzy retrieval and Google Gemini answers.

## Run

Install `requirements.txt` in a virtual environment. Set `GEMINI_API_KEY` and a strong `ADMIN_PASSWORD` in your environment or a local `.env` file, then run `uvicorn main:app --reload`.

Open `/` to chat or `/admin` to edit FAQs. The admin login accepts any username and the configured password. Admin access is disabled when no password is configured. Use HTTPS when hosting this app, since HTTP Basic credentials travel with admin requests.

FAQ data is stored in `data/faqs.json` relative to the application. Saves validate entries and replace the file atomically. This remains a small, single-instance demo: simultaneous admin edits use last-save-wins behavior. Public chat calls consume your configured Gemini quota; add deployment-level authentication and rate limits before exposing it broadly.

## Checks

Install `httpx` in addition to the application requirements and have Node.js available. Run `python -m unittest -v`. Tests cover admin access, invalid data, Unicode storage, interrupted saves, service failures, FAQ attribution and browser script syntax without making live AI requests.
