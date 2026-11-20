import { XMLParser, XMLValidator } from "fast-xml-parser";
export type LiveArticle = { title: string; summary: string; link: string; source: string; published: string };
export const RSS_SOURCES = [
  { name: "BSE Notices", url: "https://www.bseindia.com/data/xml/notices.xml" },
  { name: "Economic Times", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
  { name: "Moneycontrol", url: "https://www.moneycontrol.com/rss/marketreports.xml" },
];
export function parseFeed(xml: string, source: string): LiveArticle[] {
  if (XMLValidator.validate(xml) !== true) throw new Error("Invalid feed");
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  if (!parsed.rss?.channel) throw new Error("Source did not return RSS");
  const raw = parsed.rss.channel.item ?? [];
  const clean = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return (Array.isArray(raw) ? raw : [raw]).slice(0, 30).flatMap((item) => {
    const link = String(item.link ?? "");
    try { const url = new URL(link); if (url.protocol !== "https:" && url.protocol !== "http:") return []; } catch { return []; }
    const title = clean(item.title); if (!title) return [];
    return [{ title, summary: clean(item.description).slice(0, 500), link, source, published: clean(item.pubDate) }];
  });
}