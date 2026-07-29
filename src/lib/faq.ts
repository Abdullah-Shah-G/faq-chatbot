import faqs from "@/data/faq.json";
import type { FaqEntry, MatchResult } from "./types";

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function normalizedSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean)
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function hybridScore(query: string, faq: FaqEntry): number {
  const qLev = normalizedSimilarity(query, faq.question);
  const qJac = jaccardSimilarity(query, faq.question);
  const tagScore = faq.tags.some((tag) =>
    query.toLowerCase().includes(tag.toLowerCase())
  )
    ? 0.15
    : 0;
  return qLev * 0.4 + qJac * 0.4 + tagScore * 0.2;
}

export function findMatches(query: string, threshold = 0.35): MatchResult[] {
  const scored = (faqs as FaqEntry[]).map((faq) => ({
    faq,
    score: hybridScore(query, faq),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score >= threshold)
    .slice(0, 3)
    .map((s) => ({ faq: s.faq, score: s.score }));
}

export function getAllFaqs(): FaqEntry[] {
  return faqs as FaqEntry[];
}
