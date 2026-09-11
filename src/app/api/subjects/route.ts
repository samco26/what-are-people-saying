import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { collectNewsSubjects, newsDay } from "@/lib/newsSubjects";
import { mixSubjects, type SuggestionsResponse, type NewsSubject } from "@/lib/suggestions";

export const runtime = "nodejs";
export const maxDuration = 25;
export const dynamic = "force-dynamic";

// Cache only public news topic suggestions, never collected social-media opinions.
// A date key rolls over daily; hourly refresh also admits breaking stories.
const cachedNews = unstable_cache(collectNewsSubjects, ["news-subjects-v1"], { revalidate: 3600 });
const pending = new Map<string, Promise<NewsSubject[]>>();

export async function GET() {
  const day = newsDay();
  let request = pending.get(day);
  if (!request) {
    request = cachedNews(day).catch(() => []);
    pending.set(day, request);
  }
  let news: NewsSubject[];
  try { news = await request; } finally { pending.delete(day); }
  // Never carry a cached previous-day story into today's rotation.
  news = news.filter((entry) => newsDay(new Date(entry.publishedAt)) === newsDay());
  const response: SuggestionsResponse = {
    subjects: mixSubjects(news), news, day: newsDay(), mode: news.length ? "news-mix" : "evergreen",
  };
  return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
}
