import { z } from "zod";
export const SECTOR_OPTIONS = ["All Sectors", "Banking", "IT", "Defence", "Auto", "Pharma", "Metal", "Energy", "Infra", "Semiconductors", "FMCG", "Realty"];
export const SOURCE_OPTIONS = ["All Verified Sources", "Official Exchange & Regulators", "Economic Times", "Moneycontrol", "LiveMint", "Business Standard", "Financial Express", "CNBC-TV18 / NDTV Profit", "The Hindu BusinessLine", "Other Verified Media"];
export const translationSchema = z.object({ headline: z.string(), tldr: z.array(z.string()).length(3) });
export const enrichmentSchema = z.object({ en: translationSchema, hi: translationSchema, hinglish: translationSchema, tag: z.enum(["Signal", "Watch", "Noise"]), sectors: z.array(z.object({ name: z.string(), impact: z.enum(["Positive", "Negative", "Neutral"]) })), stocks: z.array(z.object({ symbol: z.string(), name: z.string() })), terms: z.array(z.object({ term: z.string(), definition: z.string() })) });
export type Enrichment = z.infer<typeof enrichmentSchema>;
export type ArchivedArticle = { id: string; title: string; summary: string; source: string; link: string; published_at: string; enrichment: Enrichment | null };
export function istDate(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
export function isMarketOpen(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  return !["Sat", "Sun"].includes(get("weekday")) && mins >= 555 && mins <= 930;
}
export function sourceMatches(source: string, filter: string) { return filter === "All Verified Sources" || (filter === "Official Exchange & Regulators" ? /BSE|NSE|SEBI|RBI/.test(source) : filter === "CNBC-TV18 / NDTV Profit" ? /CNBC|NDTV/.test(source) : filter === "Other Verified Media" ? /Google/.test(source) : source === filter); }
export function prohibitedRumour(text: string) { return /telegram|whatsapp|viral rumou?r|social media rumou?r|unverified rumou?r/i.test(text); }