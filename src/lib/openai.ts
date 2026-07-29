import OpenAI from "openai";
import type { MatchResult } from "./types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are SupportBot, a concise and accurate FAQ assistant. Always try to answer from the provided FAQ knowledge base. If the user's question matches an FAQ entry, respond with the FAQ answer and show a one-line citation like "(source: FAQ)". If the user asks something not in the FAQ, ask one clarifying question or reply: "I don't have that information — would you like me to escalate or search for more details?" Keep answers short (max 120 words). Avoid hallucinations. If the user asks for links or actions, provide them only if present in the FAQ.`;

export async function generateReply(
  userMessage: string,
  candidateFaqs: MatchResult[]
): Promise<{ reply: string; matchedFaqId: string | null }> {
  const context =
    candidateFaqs.length > 0
      ? `Context (candidate FAQs):\n${candidateFaqs
          .map(
            (c, i) =>
              `${i + 1}) Q: ${c.faq.question}\n   A: ${c.faq.answer}`
          )
          .join("\n\n")}\n\nUser: ${userMessage}`
      : `User: ${userMessage}`;

  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 250,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: context },
    ],
  });

  const reply = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't process that request.";
  const matchedFaqId =
    reply.includes("(source: FAQ)") && candidateFaqs.length > 0
      ? candidateFaqs[0].faq.id
      : null;

  return { reply, matchedFaqId };
}
