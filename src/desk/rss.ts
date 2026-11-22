import { XMLParser, XMLValidator } from "fast-xml-parser";
export type LiveArticle = { title: string; summary: string; link: string; source: string; published: string };
export const RSS_SOURCES = [
  { name: "BSE Notices", url: "https://www.bseindia.com/data/xml/notices.xml" },
  { name: "Economic Times", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
  { name: "Moneycontrol", url: "https://news.google.com/rss/search?q=site%3Amoneycontrol.com&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { name: "NSE Filings", url: "https://news.google.com/rss/search?q=site%3Anseindia.com+corporate+announcements&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { name: "SEBI", url: "https://www.sebi.gov.in/sebirss.xml" },
  { name: "RBI", url: "https://www.rbi.org.in/pressreleases_rss.xml" },
  { name: "LiveMint", url: "https://www.livemint.com/rss/markets" },
  { name: "Business Standard", url: "https://news.google.com/rss/search?q=site%3Abusiness-standard.com&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { name: "Financial Express", url: "https://news.google.com/rss/search?q=site%3Afinancialexpress.com&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { name: "CNBC-TV18", url: "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml" },
  { name: "NDTV Profit", url: "https://news.google.com/rss/search?q=site%3Andtvprofit.com&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { name: "The Hindu BusinessLine", url: "https://www.thehindubusinessline.com/markets/feeder/default.rss" },
  { name: "Google News India Business", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en" },
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