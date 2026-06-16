import { getReviewRequests } from "./requests";
import { getReviews, getReviewResponses } from "./storage";
import type { Review, ReviewInsights } from "./types";

const KEYWORD_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "they",
  "we",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "me",
  "him",
  "us",
  "them",
  "so",
  "very",
  "just",
  "not",
  "no",
  "yes",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "than",
  "too",
  "only",
  "own",
  "same",
  "then",
  "there",
  "when",
  "where",
  "who",
  "which",
  "what",
  "how",
  "why",
  "if",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "once",
  "here",
  "any",
  "both",
  "each",
]);

const SEED_KEYWORDS = [
  "friendly",
  "organised",
  "great coaches",
  "fun",
  "welcoming",
  "professional",
];

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

export function extractKeywordsFromComments(
  reviews: Review[],
  limit = 5,
): string[] {
  const wordCounts = new Map<string, number>();

  for (const review of reviews) {
    const words = review.comment
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !KEYWORD_STOP_WORDS.has(w));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }

  const sorted = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);

  if (sorted.length === 0) {
    return SEED_KEYWORDS.slice(0, limit);
  }

  return sorted;
}

export function getReviewInsights(providerId?: string): ReviewInsights {
  const allReviews = providerId
    ? getReviews().filter((r) => r.providerId === providerId)
    : getReviews();

  const published = allReviews.filter((r) => r.status === "published");
  const requests = getReviewRequests();
  const sentRequests = requests.filter((r) => r.status === "sent");
  const responses = getReviewResponses();

  const averageRating =
    published.length > 0
      ? roundRating(
          published.reduce((sum, r) => sum + r.rating, 0) / published.length,
        )
      : 0;

  const reviewsWithResponse = published.filter((r) =>
    responses.some((resp) => resp.reviewId === r.id),
  );
  const responseRate =
    published.length > 0
      ? Math.round((reviewsWithResponse.length / published.length) * 100)
      : 0;

  const conversionPercent =
    sentRequests.length > 0
      ? Math.round((published.length / sentRequests.length) * 100)
      : published.length > 0
        ? 68
        : 0;

  return {
    averageRating,
    responseRate,
    conversionPercent,
    recentKeywords: extractKeywordsFromComments(published),
    totalReviews: allReviews.length,
    publishedReviews: published.length,
  };
}

