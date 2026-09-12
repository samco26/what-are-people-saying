/* YouTube, through the YouTube Data API v3 with an API key.

   Two stages: a video search by views, then top comments on each video.
   Video titles/descriptions are context; comments are the opinions.
   Individual failures are reported without discarding other comments.

   Bounds: the 10 most-viewed matching videos and 30 top comments each,
   so at most 300 opinions plus 10 video context entries. When top comments
   are too old, also check recent comments (up to 21 calls, reused across windows).
   Each search costs 100 quota units and each comment list 1, against the
   API's free daily quota of 10,000, so a search is about 110–120 units.

   Not verified against the live API yet: written from the API's published
   shapes and switched on only when YOUTUBE_API_KEY exists. */

import type { SourceItem } from "../types";
import { env } from "../env";
import { getJson, getOnce, inWindow, reasonFor, tidy, type Collected, type CollectOptions, type Connector } from "./shared";

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
  // Search older videos too: recency applies to opinions, not video uploads.
  if (opts.to) search.searchParams.set("publishedBefore", opts.to.toISOString());
  search.searchParams.set("key", key);

  const found = await getOnce("youtube:videos", opts, () => getJson<SearchResponse>(search.toString(), { signal: opts.signal }));
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
      title: s.title,
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
      const read = (order: "relevance" | "time") => {
        const ordered = new URL(url);
        ordered.searchParams.set("order", order);
        return getOnce(`youtube:${id}:${order}`, opts, () => getJson<CommentThreadsResponse>(ordered.toString(), { signal: opts.signal }));
      };
      const convert = (res: CommentThreadsResponse): SourceItem[] => (res.items ?? []).flatMap((t) => {
        const comment = t.snippet?.topLevelComment;
        const c = comment?.snippet;
        const text = c?.textOriginal ?? c?.textDisplay;
        if (!text?.trim() || !comment?.id || !c?.publishedAt || !Number.isFinite(Date.parse(c.publishedAt))) return [];
        if (!inWindow(c.publishedAt, opts.from, opts.to)) return [];
        return [{
          id: `youtube:comment:${comment.id}`, source: "youtube", kind: "comment",
          text, parentId: `youtube:video:${id}`,
          author: c.authorDisplayName,
          url: `https://www.youtube.com/watch?v=${id}&lc=${comment.id}`,
          publishedAt: c.publishedAt, engagement: c.likeCount,
        }];
      });
      const selected = new Map<string, SourceItem>();
      const add = (batch: SourceItem[]) => {
        for (const item of batch) if (selected.size < perVideo && !selected.has(item.id)) selected.set(item.id, item);
      };
      add((opts.previousItems ?? []).filter((item) => item.parentId === `youtube:video:${id}`));
      add(convert(await read("relevance")));
      // An old video's top comments can also be old. Check its recent comments
      // before deciding it has no discussion inside the requested window.
      if (selected.size < perVideo) {
        try { add(convert(await read("time"))); }
        catch (err) { failures.push(reasonFor(err, opts.signal.aborted)); }
      }
      return [...selected.values()];
    } catch (err) {
      failures.push(reasonFor(err, opts.signal.aborted));
      return [] as SourceItem[];
    }
  });
  for (const batch of await Promise.all(commentRuns)) items.push(...batch);

  const count = items.filter((item) => item.kind === "comment").length;
  const shortfall = count < maxVideos * perVideo;
  const notes = [
    shortfall ? `Read ${count} of up to 300 comments from ${videos.length} of 10 matching videos; comments are filtered to the search window.` : "",
    failures.length ? `${failures.length} video comment sections could not be read. ${[...new Set(failures)].join(" ")}` : "",
    shortfall && !failures.length ? "Some videos or in-window comments were not available." : "",
  ].filter(Boolean);
  return {
    items,
    canExpand: videos.length > 0 && failures.length < videos.length,
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
