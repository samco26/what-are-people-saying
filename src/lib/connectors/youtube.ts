/* YouTube, through the YouTube Data API v3 with an API key.

   Two stages: a video search by views, then top comments on each video.
   Video titles/descriptions are context; comments are the opinions.
   Individual failures are reported without discarding other comments.

   Bounds: the 10 most-viewed matching videos and 30 top comments each,
   so at most 300 opinions plus 10 video context entries, in 11 API calls.
   Each search costs 100 quota units and each comment list 1, against the
   API's free daily quota of 10,000, so a search is about 110 units.

   Not verified against the live API yet: written from the API's published
   shapes and switched on only when YOUTUBE_API_KEY exists. */

import type { SourceItem } from "../types";
import { env } from "../env";
import { getJson, inWindow, reasonFor, tidy, type Collected, type CollectOptions, type Connector } from "./shared";

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
        id?: string;
        snippet?: { textOriginal?: string; textDisplay?: string; likeCount?: number; publishedAt?: string; authorDisplayName?: string };
      };
    };
  }>;
}

async function collect(opts: CollectOptions): Promise<Collected> {
  const key = env("YOUTUBE_API_KEY") ?? "";
  const maxVideos = 10;
  const perVideo = 30;

  const search = new URL(`${API}/search`);
  search.searchParams.set("part", "snippet");
  search.searchParams.set("type", "video");
  search.searchParams.set("q", opts.subject);
  search.searchParams.set("maxResults", String(maxVideos));
  search.searchParams.set("order", "viewCount");
  search.searchParams.set("fields", "items(id/videoId,snippet(title,description,publishedAt,channelTitle))");
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
      text: tidy(`${s.title ?? ""}. ${s.description ?? ""}`, Infinity),
      author: s.channelTitle,
      url: `https://www.youtube.com/watch?v=${id}`,
      publishedAt: s.publishedAt,
    });
  }

  /* Fetch all ten comment sections concurrently. Any access failure or
     timeout is reported as a shortfall, preserving the successful sections. */
  const failures: string[] = [];
  const commentRuns = videos.map(async (v) => {
    const id = v.id!.videoId!;
    const url = new URL(`${API}/commentThreads`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", id);
    url.searchParams.set("maxResults", String(perVideo));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("textFormat", "plainText");
    url.searchParams.set("fields", "items(snippet/topLevelComment(id,snippet(textOriginal,textDisplay,likeCount,publishedAt,authorDisplayName)))");
    url.searchParams.set("key", key);
    try {
      const res = await getJson<CommentThreadsResponse>(url.toString(), { signal: opts.signal });
      return (res.items ?? []).flatMap((t) => {
        const comment = t.snippet?.topLevelComment;
        const c = comment?.snippet;
        const text = c?.textOriginal ?? c?.textDisplay;
        if (!text?.trim() || !comment?.id) return [];
        if (!inWindow(c?.publishedAt, opts.from, opts.to)) return [];
        const item: SourceItem = {
          id: `youtube:comment:${comment.id}`,
          source: "youtube",
          kind: "comment",
          text: tidy(text, Infinity),
          parentId: `youtube:video:${id}`,
          author: c?.authorDisplayName,
          url: `https://www.youtube.com/watch?v=${id}&lc=${comment.id}`,
          publishedAt: c?.publishedAt,
          engagement: c?.likeCount,
        };
        return [item];
      });
    } catch (err) {
      failures.push(reasonFor(err, opts.signal.aborted));
      return [] as SourceItem[];
    }
  });
  for (const batch of await Promise.all(commentRuns)) items.push(...batch);

  const count = items.filter((item) => item.kind === "comment").length;
  const shortfall = count < maxVideos * perVideo;
  const notes = [
    shortfall ? `Read ${count} of up to 300 comments from ${videos.length} of 10 matching videos in the search window.` : "",
    failures.length ? `${failures.length} video comment sections could not be read. ${[...new Set(failures)].join(" ")}` : "",
    shortfall && !failures.length ? "Some videos or in-window comments were not available." : "",
  ].filter(Boolean);
  return {
    items,
    status: {
      source: "youtube",
      availability: count === 0 ? "unavailable" : shortfall ? "partial" : "ok",
      itemsAnalysed: count,
      ...(notes.length ? { note: notes.join(" ") } : {}),
    },
  };
}

export const youtube: Connector = {
  id: "youtube",
  configured: () => Boolean(env("YOUTUBE_API_KEY")),
  collect,
};
