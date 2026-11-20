import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StockLink } from "./StockLink";
import { STOCKS, mentionedStocks } from "./stocks";
import { GLOSSARY, tr, type Lang, type News } from "./data";
import { useSpeaker } from "./speech";

function Glossed({ text }: { text: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const keys = Object.keys(GLOSSARY);
  const re = new RegExp(`(${keys.map((k) => k.replace(/[/]/g, "\\/")).join("|")})`, "g");
  return (
    <span className="relative">
      {text.split(re).map((p, i) =>
        GLOSSARY[p] ? (
          <Button variant="ghost" key={i} onClick={() => setOpen(open === p ? null : p)} className="underline decoration-dotted decoration-2 underline-offset-2 font-bold">
            {p}
          </Button>
        ) : <span key={i}>{p}</span>,
      )}
      {open && (
        <span className="absolute left-0 top-6 z-20 block w-64 paper-card p-3 text-xs">
          <b>{open}</b>: {GLOSSARY[open]}
          <Button variant="ghost" className="ml-2 underline" onClick={() => setOpen(null)}>close</Button>
        </span>
      )}
    </span>
  );
}

const tagCls = { Signal: "bg-gain text-primary-foreground", Watch: "bg-warn text-foreground", Noise: "bg-muted text-muted-foreground" };

export function NewsCard({ n, lang }: { n: News; lang: Lang }) {
  const [deep, setDeep] = useState(false);
  const sp = useSpeaker();
  const hideCall = n.verification !== "Verified";
  const ratio = n.pe / n.pe5y;
  const priced = ratio > 1.15 ? "Fully Priced-In" : ratio < 0.92 ? "Not Priced-In" : "Partly Priced-In";
  const speakText = `${n.headline[lang]}. ${n.tldr[lang].join(". ")}`;

  return (
    <article className="paper-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-bold text-foreground">{n.source}</span><span>• {n.time}</span>
        <span>• Quality {"★".repeat(n.quality)}{"☆".repeat(5 - n.quality)} ({n.quality}/5)</span>
        <span className={`px-2 py-0.5 border ${n.verification === "Verified" ? "border-gain text-gain" : "border-loss text-loss"}`}>{n.verification === "Verified" ? "✔" : "⚠"} {n.verification}</span>
        <span className={`px-2 py-0.5 font-bold ${tagCls[n.tag]}`}>{n.tag}</span>
        {!hideCall && <span className={`px-2 py-0.5 border font-bold ${n.sentiment === "Bull" ? "border-gain text-gain" : "border-loss text-loss"}`}>{n.sentiment === "Bull" ? "▲ Bull" : "▼ Bear"}</span>}
      </div>
      <h3 className="text-xl font-bold leading-snug">{stockHeadline(n.headline[lang])}</h3>
      <div className="flex flex-wrap gap-3 text-xs">{mentionedStocks(n.headline.en + " " + n.winners.join(" ") + " " + n.losers.join(" ")).map(s => <StockLink key={s.symbol} symbol={s.symbol} />)}</div>
      <ul className="list-disc pl-5 text-sm space-y-1">{n.tldr[lang].map((t, i) => <li key={i}><Glossed text={t} /></li>)}</ul>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex justify-between"><span>Portfolio Relevance</span><b>{n.relevance}/100</b></div>
          <div className="h-2 bg-muted mt-1"><div className="h-2 bg-primary" style={{ width: `${n.relevance}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between"><span>Priced-In: <Glossed text="P/E" /> {n.pe} vs 5Y {n.pe5y}</span><b>{priced}</b></div>
          <div className="h-2 bg-muted mt-1 relative"><div className="absolute h-2 w-1 bg-foreground" style={{ left: `${Math.min(98, Math.max(0, (ratio - 0.5) * 100))}%` }} /><div className="h-2 bg-highlight" style={{ width: "50%" }} /></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sp.state === "idle" ? (
          <Button variant="ghost" onClick={() => sp.play(speakText)} className="border border-foreground px-3 py-1 text-sm font-bold hover:bg-accent">{tr("listen", lang)}</Button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border border-foreground px-3 py-1.5 text-sm w-full">
            {sp.state === "playing" ? <Button variant="ghost" onClick={sp.pause} className="font-bold">⏸ Pause</Button> : <Button variant="ghost" onClick={sp.resume} className="font-bold">▶ Resume</Button>}
            <Button variant="ghost" onClick={sp.stop} className="font-bold">⏹ Stop</Button>
            <label className="flex items-center gap-2 flex-1 min-w-40">Speed
              <input type="range" min={1} max={2} step={0.1} value={sp.rate} onChange={(e) => sp.setRate(Number(e.target.value))} className="flex-1 accent-foreground" />
              <b>{sp.rate.toFixed(1)}x</b>
            </label>
          </div>
        )}
        <Button variant="ghost" onClick={() => setDeep(!deep)} className="ml-auto text-sm underline font-bold">{deep ? "Close ▲" : tr("deep", lang)}</Button>
      </div>

      {deep && (
        <div className="border-t border-dashed pt-3 grid sm:grid-cols-2 gap-3 text-sm">
          {hideCall ? <p className="sm:col-span-2 text-loss">Impact & Bull/Bear hidden until the story is verified.</p> : <>
            <p><b>Impact:</b> {n.impact}</p>
            <p><b>Winners:</b> {n.winners.map((s,i) => <span key={s}>{i > 0 && ", "}<StockLink symbol={s} /></span>)} · <b>Losers:</b> {n.losers.map((s,i) => <span key={s}>{i > 0 && ", "}{STOCKS.some(k => k.symbol === s) ? <StockLink symbol={s} /> : s}</span>)}</p>
            <p><b className="text-gain">Bull:</b> {n.bull}</p><p><b className="text-loss">Bear:</b> {n.bear}</p>
          </>}
          <p><b>Thesis:</b> <span className="bg-highlight px-1">#{n.thesis}</span></p>
          <p><b>Historic Pattern:</b> {n.pattern}</p>
          <div className="sm:col-span-2"><b>Story Timeline</b>
            <ol className="mt-1 border-l-2 border-foreground pl-3 space-y-1">{n.timeline.map((t, i) => <li key={i}><b>{t.d}</b> — {t.e}</li>)}</ol>
          </div>
        </div>
      )}
    </article>
  );
}

function stockHeadline(text: string) {
  const names = STOCKS.map(s => (s.name.split(" / ")[0] ?? s.name));
  const parts = text.split(new RegExp(`(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g"));
  return parts.map((part,i) => { const s = STOCKS.find(s => (s.name.split(" / ")[0] ?? s.name) === part); return s ? <StockLink key={i} symbol={s.symbol} label={part} /> : <span key={i}>{part}</span>; });
}
