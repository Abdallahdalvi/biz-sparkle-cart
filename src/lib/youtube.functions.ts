import { createServerFn } from "@tanstack/react-start";

const CHANNEL_ID = "UCNINDMegHpb0oB8rlzU8yhQ";

export interface YouTubeChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: number | null;
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function xmlValue(entry: string, tag: string) {
  const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

export const getYouTubeChannelVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<YouTubeChannelVideo[]> => {
    try {
      const response = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
        {
          headers: { accept: "application/atom+xml" },
          cache: "no-store",
        },
      );
      if (!response.ok) return [];

      const xml = await response.text();
      return Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi))
        .map((match) => {
          const entry = match[1];
          const id = xmlValue(entry, "yt:videoId");
          const thumbnail =
            entry.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&") ||
            (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
          const viewsText = entry.match(/<media:statistics[^>]+views="(\d+)"/i)?.[1];
          return {
            id,
            title: xmlValue(entry, "title"),
            thumbnail,
            publishedAt: xmlValue(entry, "published"),
            views: viewsText ? Number(viewsText) : null,
          };
        })
        .filter((video) => video.id && video.title)
        .slice(0, 12);
    } catch {
      return [];
    }
  },
);
