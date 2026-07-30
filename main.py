import json
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel

from chain import find_matches, generate_reply

app = FastAPI(title="FAQ Chatbot")

DATA_FILE = "data/faqs.json"
TEMPLATES_DIR = Path("templates")


def render(name: str, **context) -> str:
    html = (TEMPLATES_DIR / name).read_text(encoding="utf-8")
    for key, val in context.items():
        html = html.replace(f"{{{{ {key} }}}}", str(val))
    return html


def load_faqs() -> list[dict]:
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            return json.load(f)
    return []


def save_faqs(faqs: list[dict]):
    with open(DATA_FILE, "w") as f:
        json.dump(faqs, f, indent=2)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    matched_faq_id: str | None = None
    follow_up_required: bool = True


@app.get("/")
async def index():
    return HTMLResponse(render("index.html"))


@app.get("/admin")
async def admin():
    faqs = load_faqs()
    return HTMLResponse(render("admin.html", faqs=json.dumps(faqs)))


@app.post("/api/faq")
async def save_faq(request: Request):
    body = await request.json()
    save_faqs(body)
    return JSONResponse({"ok": True})


@app.get("/api/faq")
async def get_faq():
    return JSONResponse(load_faqs())


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    faqs = load_faqs()
    candidates = find_matches(req.message, faqs)
    reply, matched_id = await generate_reply(req.message, candidates)

    return ChatResponse(
        reply=reply,
        matched_faq_id=matched_id,
        follow_up_required=matched_id is None,
    )
