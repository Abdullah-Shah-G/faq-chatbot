# FAQ Chatbot

A rule-based + LLM FAQ chatbot built with Next.js. Answers user questions using a structured FAQ knowledge base with fuzzy matching, and falls back to an LLM (OpenAI) for clarifying questions.

## Features

- **Chat UI** — Real-time chat interface with message history
- **FAQ Matching** — Hybrid fuzzy matching (Levenshtein + Jaccard similarity + tag scoring)
- **LLM Fallback** — OpenAI-powered responses when no FAQ matches
- **Admin Panel** — Edit, add, delete FAQ entries (`/admin`)
- **Citation Badge** — Shows "Answered from FAQ" badge when reply uses the knowledge base

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **LLM**: OpenAI API (gpt-4o-mini)
- **Matching**: Custom hybrid similarity algorithm
- **Storage**: Local JSON seed data + browser localStorage for admin edits

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key
# OPENAI_API_KEY=sk-...

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the chat UI. Open [http://localhost:3000/admin](http://localhost:3000/admin) to manage FAQ entries.

## API

### POST /api/chat

**Request:**
```json
{
  "session_id": "session_1",
  "message": "What is your refund policy?"
}
```

**Response:**
```json
{
  "reply": "We offer refunds within 30 days for unused subscriptions. (source: FAQ)",
  "matched_faq_id": "1",
  "follow_up_required": false
}
```

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts    # Chat API endpoint
│   ├── admin/page.tsx        # Admin FAQ editor
│   ├── page.tsx              # Chat page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── chat-ui.tsx           # Chat UI component
├── lib/
│   ├── faq.ts                # FAQ matching logic
│   ├── openai.ts             # OpenAI integration
│   └── types.ts              # TypeScript types
└── data/
    └── faq.json              # Seed FAQ knowledge base
```

## Eval Metrics

- Accuracy vs ground truth FAQ answers
- Rate of clarifying questions
- User satisfaction score

## Extensions (Ideas)

- Add fallback web search
- Add conversation memory for follow-ups
- Add analytics for unanswered question trends
- Use vector embeddings for semantic search
