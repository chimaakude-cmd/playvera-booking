import { NextResponse } from "next/server";
import { AI_SEARCH_ONLY } from "@/lib/ai/constants";
import {
  parseSearchQuery,
  validateAiSearchResponse,
  type AiSearchParseResult,
} from "@/lib/ai/search-assistant";

type SearchRequestBody = {
  query?: string;
};

export async function POST(request: Request) {
  if (!AI_SEARCH_ONLY) {
    return NextResponse.json(
      { error: "AI search assistant is disabled." },
      { status: 403 },
    );
  }

  let body: SearchRequestBody;
  try {
    body = (await request.json()) as SearchRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  if (query.length > 500) {
    return NextResponse.json(
      { error: "Query must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const result: AiSearchParseResult = await parseSearchQuery(query);
    const validated = validateAiSearchResponse(result);

    if (!validated) {
      return NextResponse.json(
        { error: "Could not produce safe search filters." },
        { status: 422 },
      );
    }

    return NextResponse.json(validated);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Activora AI search]", error);
    }

    return NextResponse.json(
      { error: "Failed to parse search query." },
      { status: 500 },
    );
  }
}
