import { XMLParser } from "fast-xml-parser";

export interface RssItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date | null;
  imageUrl: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function firstString(v: unknown): string {
  if (Array.isArray(v)) return firstString(v[0]);
  if (v && typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>)["#text"] ?? "");
  }
  return v == null ? "" : String(v);
}

function extractImage(item: Record<string, unknown>): string | null {
  const thumb = item["media:thumbnail"] ?? item["media:content"];
  if (Array.isArray(thumb)) {
    const last = thumb[thumb.length - 1] as Record<string, unknown>;
    if (last?.["@_url"]) return String(last["@_url"]);
  } else if (thumb && typeof thumb === "object") {
    const url = (thumb as Record<string, unknown>)["@_url"];
    if (url) return String(url);
  }
  const enclosure = item["enclosure"] as Record<string, unknown> | undefined;
  if (enclosure?.["@_url"]) return String(enclosure["@_url"]);
  return null;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchFeed(url: string): Promise<RssItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "DailyNewsBot/1.0 (+https://dailynews)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Feed ${url} returned ${res.status}`);
  const xml = await res.text();
  const data = parser.parse(xml);
  const channel = data?.rss?.channel ?? data?.feed ?? {};
  const rawItems = channel.item ?? channel.entry ?? [];
  const items: Record<string, unknown>[] = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((it): RssItem => {
      const link =
        firstString(it.link && typeof it.link === "object" ? (it.link as Record<string, unknown>)["@_href"] : it.link) ||
        firstString(it.guid);
      const dateStr = firstString(it.pubDate || it.published || it.updated);
      const d = dateStr ? new Date(dateStr) : null;
      return {
        title: stripHtml(firstString(it.title)),
        link: link.trim(),
        summary: stripHtml(firstString(it.description || it.summary || it["content:encoded"])),
        publishedAt: d && !isNaN(d.getTime()) ? d : null,
        imageUrl: extractImage(it),
      };
    })
    .filter((i) => i.title && i.link);
}
