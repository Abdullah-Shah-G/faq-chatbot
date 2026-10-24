import json
import os
import secrets
import tempfile
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel, Field

from chain import find_matches, generate_reply

app = FastAPI(title="FAQ Chatbot")

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data/faqs.json"
TEMPLATES_DIR = BASE_DIR / "templates"
security = HTTPBasic()


def require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        raise HTTPException(503, "Set ADMIN_PASSWORD to enable FAQ editing.")
    if not secrets.compare_digest(credentials.password.encode(), password.encode()):
        raise HTTPException(401, "Invalid credentials", headers={"WWW-Authenticate": "Basic"})


def render(name: str, **context) -> str:
    html = (TEMPLATES_DIR / name).read_text(encoding="utf-8")
    for key, val in context.items():
        html = html.replace(f"{{{{ {key} }}}}", str(val))
    return html


def load_faqs() -> list[dict]:
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def save_faqs(faqs: list[dict]):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=DATA_FILE.parent, delete=False) as f:
            temporary = Path(f.name)
            json.dump(faqs, f, indent=2, ensure_ascii=False)
        os.replace(temporary, DATA_FILE)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


class FAQ(BaseModel):
    id: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")
    question: str = Field(min_length=1, max_length=2000)
    answer: str = Field(min_length=1, max_length=20000)
    tags: list[str] = Field(default_factory=list, max_length=100)
    last_updated: str = ""


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000, pattern=r"\S")


class ChatResponse(BaseModel):
    reply: str
    matched_faq_id: str | None = None
    follow_up_required: bool = True


@app.get("/")
async def index():
    return HTMLResponse(render("index.html"))


@app.get("/admin", dependencies=[Depends(require_admin)])
async def admin():
    faqs = load_faqs()
    return HTMLResponse(render("admin.html", faqs=json.dumps(faqs).replace("<", "\\u003c")))


@app.post("/api/faq", dependencies=[Depends(require_admin)])
async def save_faq(body: list[FAQ]):
    if len({faq.id for faq in body}) != len(body):
        raise HTTPException(422, "FAQ IDs must be unique.")
    save_faqs([faq.model_dump() for faq in body])
    return JSONResponse({"ok": True})


@app.get("/api/faq")
async def get_faq():
    return JSONResponse(load_faqs())


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    faqs = load_faqs()
    candidates = find_matches(req.message, faqs)
    try:
        reply, matched_id = await generate_reply(req.message, candidates)
    except Exception:
        raise HTTPException(503, "The answer service is unavailable. Please try again later.") from None

    return ChatResponse(
        reply=reply,
        matched_faq_id=matched_id,
        follow_up_required=matched_id is None,
    )
