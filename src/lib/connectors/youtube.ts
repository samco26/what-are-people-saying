/* YouTube, through the YouTube Data API v3 with an API key.

   Two calls: a video search for the subject, then the top comments on each
   of the first few videos. Both the video titles (with their descriptions)
   and the comments become items, because a comment thread is where the
   opinion is. Comments are disabled on some videos; that is a 403 on one
   video, not a failure of the source, so it is skipped.

   Bounds: YOUTUBE_MAX_VIDEOS (default 8) and YOUTUBE_COMMENTS_PER_VIDEO
   (default 20), so at most about 170 items and nine API calls a search.
   Each search costs 100 quota units and each comment list 1, against the
   API's free daily quota of 10,000, so a search is about 108 units.

   Not verified against the live API yet: written from the API's published
   shapes and switched on only when YOUTUBE_API_KEY exists. */

import type { SourceItem } from "../types";
import { env, envInt } from "../env";
import { getJson, inWindow, statusFor, tidy, type Collected, type CollectOptions, type Connector } from "./shared";

const API = "https://www.googleapis.com/youtube/v3";

interface SearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; description?: string; publishedAt?: string; channelTitle?: string };
  }>;
}

interface CommentThreadsResponse {
  items?: Array<{
    id?: string;
    snippet?: {
      topLevelComment?: {
        snippet?: { textOriginal?: string; textDisplay?: string; likeCount?: number; publishedAt?: string; authorDisplayName?: string };
      };
    };
  }>;
}

async function collect(opts: CollectOptions): Promise<Collected> {
  const key = env("YOUTUBE_API_KEY") ?? "";
  const maxVideos = envInt("YOUTUBE_MAX_VIDEOS", 8, 1, 25);
  const perVideo = envInt("YOUTUBE_COMMENTS_PER_VIDEO", 20, 1, 100);

  const search = new URL(`${API}/search`);
  search.searchParams.set("part", "snippet");
  search.searchParams.set("type", "video");
  search.searchParams.set("q", opts.subject);
  search.searchParams.set("maxResults", String(maxVideos));
  search.searchParams.set("order", "relevance");
  search.searchParams.set("relevanceLanguage", "en");
  search.searchParams.set("safeSearch", "moderate");
  if (opts.from) search.searchParams.set("publishedAfter", opts.from.toISOString());
  if (opts.to) search.searchParams.set("publishedBefore", opts.to.toISOString());
  search.searchParams.set("key", key);

  const found = await getJson<SearchResponse>(search.toString(), { signal: opts.signal });
  const videos = (found.items ?? []).filter((v) => v.id?.videoId && v.snippet);

  const items: SourceItem[] = [];
  for (const v of videos) {
    const id = v.id!.videoId!;
    const s = v.snippet!;
    items.push({
      id: `youtube:video:${id}`,
      source: "youtube",
      kind: "video",
      text: tidy(`${s.title ?? ""}. ${s.description ?? ""}`),
      author: s.channelTitle,
      url: `https://www.youtube.com/watch?v=${id}`,
      publishedAt: s.publishedAt,
    });
  }

  /* Comments, a few videos at a time so one slow video does not hold the
     rest. A 403 here means comments are off for that video. */
  const commentRuns = videos.map(async (v) => {
    const id = v.id!.videoId!;
    const url = new URL(`${API}/commentThreads`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", id);
    url.searchParams.set("maxResults", String(perVideo));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("textFormat", "plainText");
    url.searchParams.set("key", key);
    try {
      const res = await getJson<CommentThreadsResponse>(url.toString(), { signal: opts.signal });
      return (res.items ?? []).flatMap((t) => {
        const c = t.snippet?.topLevelComment?.snippet;
        const text = c?.textOriginal ?? c?.textDisplay;
        if (!text || !t.id) return [];
        if (!inWindow(c?.publishedAt, opts.from, opts.to)) return [];
        const item: SourceItem = {
          id: `youtube:comment:${t.id}`,
          source: "youtube",
          kind: "comment",
          text: tidy(text),
          author: c?.authorDisplayName,
          url: `https://www.youtube.com/watch?v=${id}&lc=${t.id}`,
          publishedAt: c?.publishedAt,
          engagement: c?.likeCount,
        };
        return [item];
      });
    } catch {
      return [] as SourceItem[];
    }
  });
  for (const batch of await Promise.all(commentRuns)) items.push(...batch);

  const asked = maxVideos + maxVideos * perVideo;
  return { items, status: statusFor("youtube", items.length, asked) };
}

export const youtube: Connector = {
  id: "youtube",
  configured: () => Boolean(env("YOUTUBE_API_KEY")),
  collect,
};
