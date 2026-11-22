import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StockLink } from "./StockLink";
import { useSpeaker } from "./speech";
import { mentionedStocks } from "./stocks";
import { GLOSSARY, tr, type Holding, type Lang } from "./data";
import type { ArchivedArticle } from "./news-model";
import { useAccount } from "./account";
import { isTranslating, translatedFor, useTranslationTick } from "./translation";
export function FeedCard({ article: a, lang, holdings }: { article: ArchivedArticle; lang: Lang; holdings: Holding[] }) {
  const sp = useSpeaker(); const [term, setTerm] = useState<string | null>(null); const [deep, setDeep] = useState(false);
  const { user } = useAccount();
  useTranslationTick(); // re-render the moment a Gemini translation for any story lands
  const translated = translatedFor(a, lang); const headline = translated?.headline ?? a.title; const bullets = translated?.tldr ?? [a.summary];
  // If audio is playing in the old language when the selector changes, stop it so it never reads stale text.
  const firstRun = useRef(true);
  useEffect(() => { if (firstRun.current) { firstRun.current = false; return; } if (sp.state !== "idle") sp.stop(); }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const stocks = a.enrichment?.stocks ?? mentionedStocks(a.title+" "+a.summary).map(s => ({ symbol:s.symbol,name:s.name }));
  const owned = stocks.filter(s => holdings.some(h => h.symbol.toUpperCase() === s.symbol.toUpperCase()));
  const other = stocks.filter(s => !owned.includes(s)); const relevance = stocks.length ? Math.round(owned.length/stocks.length*100) : 0;
  const terms = a.enrichment?.terms ?? Object.entries(GLOSSARY).filter(([t]) => (headline + bullets.join(" ")).includes(t)).map(([term,definition]) => ({ term,definition }));
  function gloss(text: string) { if (!terms.length) return text; const pattern = terms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"); return text.split(new RegExp(`(${pattern})`,"g")).map((p,i) => terms.some(t => t.term === p) ? <Button key={i} variant="link" className="h-auto p-0 inline text-inherit underline decoration-dotted" onClick={() => setTerm(term === p ? null : p)}>{p}</Button> : <span key={i}>{p}</span>); }
  return <article id={`news-${a.id}`} className="paper-card p-4 space-y-3">
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><a className="font-bold underline" href={a.link} target="_blank" rel="noopener noreferrer">{a.source} ↗</a><span>{new Date(a.published_at).toLocaleString("en-IN",{ timeZone:"Asia/Kolkata" })} IST</span><span className={a.enrichment?.tag === "Signal" ? "text-gain font-bold" : "text-warn"}>{a.enrichment?.tag ?? "Watch"}</span><span>Publisher sourced</span></div>
    <h3 className="text-xl font-bold leading-snug">{gloss(headline)}</h3>
    <ul className="list-disc pl-5 space-y-1 text-sm">{bullets.filter(Boolean).map((b,i) => <li key={i}>{gloss(b)}</li>)}</ul>
    {!translated && <p role="status" className="text-xs text-muted-foreground italic">{isTranslating(a.id, lang) ? "⏳ Translating…" : user ? "Original text shown — translation unavailable right now." : "Sign in to translate this story."}</p>}
    {term && <div className="border p-3 bg-secondary text-sm"><b>{term}:</b> {terms.find(t => t.term === term)?.definition}<Button variant="link" size="sm" onClick={() => setTerm(null)}>Close</Button></div>}
    <div className="text-xs border-t pt-3 space-y-2"><div className="flex justify-between"><b>Portfolio Relevance</b><span>{relevance}% · matched affected stocks</span></div><progress max="100" value={relevance} className="w-full h-2 accent-foreground" /><p><b>Affected Sectors:</b> {a.enrichment?.sectors.length ? a.enrichment.sectors.map(s => <span key={s.name} className={`inline-block mr-2 ${s.impact === "Positive" ? "text-gain" : s.impact === "Negative" ? "text-loss" : "text-muted-foreground"}`}>{s.name} · {s.impact}</span>) : "Awaiting source-backed analysis"}</p><p className="flex flex-wrap gap-2"><b>In My Portfolio:</b> {owned.length ? owned.map(s => <StockLink key={s.symbol} symbol={s.symbol} />) : "None identified"}</p><p className="flex flex-wrap gap-2"><b>Other Market Stocks Affected:</b> {other.length ? other.map(s => <StockLink key={s.symbol} symbol={s.symbol} label={s.name || s.symbol} />) : "None identified"}</p></div>
    <div className="flex flex-wrap gap-2 items-center">{sp.state === "idle" ? <Button variant="outline" onClick={() => sp.play(`${headline}. ${bullets.join(". ")}`, lang)}>{tr("listen",lang)}</Button> : <><Button variant="outline" onClick={sp.state === "playing" ? sp.pause : sp.resume}>{sp.state === "playing" ? "⏸ Pause" : "▶ Resume"}</Button><Button variant="outline" onClick={sp.stop}>⏹ Stop</Button><label className="flex items-center gap-2 text-sm">Speed<input aria-label="Audio speed" type="range" min="1" max="2" step="0.1" value={sp.rate} onChange={e => sp.setRate(Number(e.target.value))} /><b>{sp.rate.toFixed(1)}x</b></label></>}<Button variant="link" className="ml-auto" onClick={() => setDeep(!deep)}>{deep ? "Close ▲" : "Deep Dive ▼"}</Button></div>
    {sp.error && <p role="status" className="text-warn text-xs">{sp.error}</p>}
    {deep && <div className="border-t pt-3 text-sm"><p>AI summaries are based on the publisher headline and excerpt, not independently verified forecasts.</p><a href={a.link} target="_blank" rel="noopener noreferrer" className="underline font-bold">Read original source ↗</a></div>}
  </article>;
}
