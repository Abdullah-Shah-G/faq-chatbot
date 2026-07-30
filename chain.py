import os
from dotenv import load_dotenv
from rapidfuzz import fuzz
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    api_key=os.getenv("GEMINI_API_KEY"),
    max_output_tokens=250,
    temperature=0.2,
)

SYSTEM_PROMPT = """You are SupportBot, a concise and accurate FAQ assistant. Always try to answer from the provided FAQ knowledge base. If the user's question matches an FAQ entry, respond with the FAQ answer and show a one-line citation like "(source: FAQ)". If the user asks something not in the FAQ, ask one clarifying question or reply: "I don't have that information — would you like me to escalate or search for more details?" Keep answers short (max 120 words). Avoid hallucinations. If the user asks for links or actions, provide them only if present in the FAQ."""


def find_matches(query: str, faqs: list[dict]) -> list[dict]:
    scored = []
    for faq in faqs:
        q_score = fuzz.token_sort_ratio(query.lower(), faq["question"].lower())
        tag_score = max(
            (fuzz.partial_ratio(query.lower(), t.lower()) for t in faq["tags"]),
            default=0,
        )
        score = max(q_score, tag_score)
        scored.append({"faq": faq, "score": score})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return [s for s in scored if s["score"] > 50][:3]


async def generate_reply(user_message: str, candidate_faqs: list[dict]) -> tuple[str, str | None]:
    if candidate_faqs:
        context_lines = []
        for i, c in enumerate(candidate_faqs, 1):
            context_lines.append(f"{i}) Q: {c['faq']['question']}\n   A: {c['faq']['answer']}")
        context = "Context (candidate FAQs):\n" + "\n\n".join(context_lines) + f"\n\nUser: {user_message}"
    else:
        context = f"User: {user_message}"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": context},
    ]

    result = await llm.ainvoke(messages)
    content = result.content
    if isinstance(content, list):
        content = "".join(c.get("text", "") for c in content)
    reply = content.strip() or "I'm sorry, I couldn't process that request."

    matched_id = None
    if "(source: FAQ)" in reply and candidate_faqs:
        matched_id = candidate_faqs[0]["faq"]["id"]

    return reply, matched_id
