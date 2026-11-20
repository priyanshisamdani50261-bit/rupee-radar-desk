import { useEffect, useState } from "react";
import { EVENTS, FLOWS, NEWS, SECTORS, SEED_HOLDINGS, TICKERS, THEME_LIMIT, sizingVerdict, tr, type Holding, type Lang } from "./data";
import { NewsCard } from "./NewsCard";
import { Portfolio, ThemeExposure, themeWeights } from "./Portfolio";
import { useSpeaker, useVoices } from "./speech";

type Tab = "command" | "portfolio" | "themes" | "calendar" | "smart" | "prefs" | "voice";
const TABS: Tab[] = ["command", "portfolio", "themes", "calendar", "smart", "prefs"];

function Ticker() {
  const [t, setT] = useState(TICKERS);
  useEffect(() => { const i = setInterval(() => setT((x) => x.map((k) => { const d = (Math.random() - 0.5) * 0.08; return { ...k, value: k.value * (1 + d / 100), chg: k.chg + d }; })), 2500); return () => clearInterval(i); }, []);
  const row = [...t, ...t];
  return (
    <div className="overflow-hidden border-y border-foreground bg-secondary text-sm">
      <div className="flex w-max animate-ticker gap-8 py-1.5 px-4">
        {row.map((k, i) => <span key={i} className="whitespace-nowrap"><b>{k.name}</b> {k.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className={k.chg >= 0 ? "text-gain" : "text-loss"}>{k.chg >= 0 ? "▲" : "▼"} {k.chg.toFixed(2)}%</span></span>)}
      </div>
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="paper-card p-3"><h4 className="font-bold border-b-2 border-foreground mb-2 pb-1">{title}</h4><div className="text-sm space-y-1">{children}</div></section>;
}

function Heatmap() {
  return <div className="grid grid-cols-3 gap-1">{SECTORS.map((s) => (
    <div key={s.s} className={`p-2 text-center text-xs font-bold ${s.c >= 0 ? "bg-gain text-primary-foreground" : "bg-loss text-primary-foreground"}`} style={{ opacity: 0.45 + Math.min(Math.abs(s.c) / 2.5, 0.55) }}>{s.s}<br />{s.c > 0 ? "+" : ""}{s.c}%</div>))}</div>;
}
function Flows() {
  return <>{FLOWS.map((f) => <div key={f.d} className="flex justify-between text-xs"><span>{f.d}</span><span className={f.fii >= 0 ? "text-gain" : "text-loss"}>FII {f.fii}</span><span className="text-gain">DII +{f.dii}</span></div>)}<p className="text-xs text-muted-foreground">₹ crore, cash segment</p></>;
}

function VoiceSettings() {
  const voices = useVoices(); const sp = useSpeaker();
  const [sel, setSel] = useState("");
  useEffect(() => setSel(localStorage.getItem("mmd-voice") || ""), []);
  const pick = (n: string) => { setSel(n); localStorage.setItem("mmd-voice", n); };
  const sample = (v: SpeechSynthesisVoice) => v.lang.startsWith("hi") ? "नमस्ते, आज निफ्टी में हल्की तेज़ी है।" : "Good morning. Nifty is trading slightly higher today.";
  const sorted = [...voices].sort((a, b) => Number(/hi|IN/.test(b.lang)) - Number(/hi|IN/.test(a.lang)));
  return (
    <section className="space-y-3"><h2 className="text-2xl font-bold">🎙️ Voice Settings</h2>
      <p className="text-sm text-muted-foreground">Hindi & Indian English voices are listed first. Test one, then pick it — all Listen buttons will use it.</p>
      {sorted.length === 0 && <p>No voices found on this device/browser.</p>}
      {sorted.map((v) => (
        <div key={v.name} className={`paper-card p-3 flex flex-wrap items-center gap-3 ${sel === v.name ? "ring-2 ring-foreground" : ""}`}>
          <div className="flex-1"><b>{v.name}</b> <span className="text-xs text-muted-foreground">{v.lang}</span></div>
          <button className="border px-2 py-1 text-sm" onClick={() => { pick(v.name); sp.play(sample(v)); }}>▶ Test</button>
          <button className="bg-primary text-primary-foreground px-2 py-1 text-sm" onClick={() => pick(v.name)}>{sel === v.name ? "✓ Selected" : "Use"}</button>
        </div>))}
    </section>
  );
}

export function Desk() {
  const [lang, setLang] = useState<Lang>("hinglish");
  const [tab, setTab] = useState<Tab>("command");
  const [filingsOnly, setFilingsOnly] = useState(false);
  const [hideNoise, setHideNoise] = useState(false);
  const [holdings, setHoldingsS] = useState<Holding[]>(SEED_HOLDINGS);
  const [menu, setMenu] = useState(false);
  const brief = useSpeaker();
  useEffect(() => { const s = localStorage.getItem("mmd-holdings"); if (s) setHoldingsS(JSON.parse(s)); }, []);
  const setHoldings = (h: Holding[]) => { setHoldingsS(h); localStorage.setItem("mmd-holdings", JSON.stringify(h)); };

  const vix = TICKERS.find((t) => t.name === "INDIA VIX")!.value;
  const noise: [string, number] = vix < 13 ? ["Calm", 25] : vix < 18 ? ["Moderate", 55] : ["High Noise", 85];
  const feed = NEWS.filter((n) => (!filingsOnly || n.filing) && (!hideNoise || n.tag !== "Noise"));
  const changed = NEWS.filter((n) => n.tag === "Signal").length;

  const { m } = themeWeights(holdings); const total = holdings.reduce((s, x) => s + x.qty * x.ltp, 0) || 1;
  const overTheme = Object.entries(m).filter(([, w]) => w > THEME_LIMIT);
  const badSize = holdings.filter((h) => sizingVerdict((h.qty * h.ltp * 100) / total, h.conviction) !== "OK");
  const health = Math.max(0, 100 - overTheme.length * 15 - badSize.length * 8);
  const redFlags = [...overTheme.map(([t, w]) => `${t} theme at ${w.toFixed(0)}% (>35%)`), ...badSize.map((h) => `${h.symbol} position size off-target`), ...NEWS.filter((n) => n.verification !== "Verified").map((n) => `Unverified: ${n.headline.en}`)];
  const hour = new Date().getHours();
  const briefText = `${hour < 15 ? "Morning" : "Evening"} brief. NIFTY at ${TICKERS[0]!.value}, up ${TICKERS[0]!.chg}%. India VIX ${vix}, noise ${noise[0]}. ` + NEWS.filter((n) => n.tag !== "Noise").map((n) => `${n.headline[lang]}. ${n.tldr[lang].join(". ")}`).join(". ") + `. Portfolio health score ${health} out of 100.`;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-3 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button className="lg:hidden border px-2 py-1" onClick={() => setMenu(!menu)}>☰ Menu</button>
          <span className="text-muted-foreground">{today}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="border px-2 py-1 bg-background">
              <option value="hinglish">Hinglish</option><option value="hi">शुद्ध हिंदी</option><option value="en">Pure English</option></select>
            <button onClick={() => setTab("voice")} className={`border px-2 py-1 ${tab === "voice" ? "bg-primary text-primary-foreground" : ""}`}>{tr("voice", lang)}</button>
            <button onClick={() => (brief.state === "idle" ? brief.play(briefText) : brief.stop())} className="bg-primary text-primary-foreground px-2 py-1 font-bold">{brief.state === "idle" ? tr("brief", lang) : "⏹ Stop Brief"}</button>
          </div>
        </div>
        <h1 className="text-center text-4xl sm:text-6xl font-bold tracking-tight py-2">MY MARKET DESK</h1>
        <div className="rule-double" />
        <p className="text-center text-xs italic text-muted-foreground py-1">Indian Markets · Signal over Noise · Est. 2026</p>
      </header>
      <Ticker />
      <div className="max-w-[1400px] mx-auto px-4 py-2 flex flex-wrap gap-4 text-sm border-b">
        <span>📰 <b>{tr("changed", lang)}</b> <span className="bg-highlight px-2 font-bold">{changed} key changes</span> · {NEWS.length} stories tracked</span>
        <span className="flex items-center gap-2 ml-auto">🔊 <b>{tr("noise", lang)}</b>
          <span className="w-32 h-2 bg-muted inline-block"><span className={`block h-2 ${Number(noise[1]) > 70 ? "bg-loss" : Number(noise[1]) > 40 ? "bg-warn" : "bg-gain"}`} style={{ width: `${noise[1]}%` }} /></span>
          {noise[0]} (VIX {vix})</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-4 grid gap-4 lg:grid-cols-[200px_1fr_300px]">
        <nav className={`${menu ? "block" : "hidden"} lg:block`}>
          <ul className="space-y-1 lg:sticky lg:top-4">{TABS.map((k) => (
            <li key={k}><button onClick={() => { setTab(k); setMenu(false); }} className={`w-full text-left px-3 py-2 border-l-4 ${tab === k ? "border-foreground bg-accent font-bold" : "border-transparent hover:bg-muted"}`}>{tr(k, lang)}</button></li>))}</ul>
        </nav>

        <main className="space-y-4 min-w-0">
          {tab === "command" && <>
            <h2 className="text-2xl font-bold border-b-2 border-foreground">{tr("command", lang)}</h2>
            {filingsOnly && <p className="text-xs bg-highlight px-2 py-1">Showing BSE/NSE filings only</p>}
            {feed.map((n) => <NewsCard key={n.id} n={n} lang={lang} />)}
          </>}
          {tab === "portfolio" && <Portfolio holdings={holdings} setHoldings={setHoldings} />}
          {tab === "themes" && <ThemeExposure holdings={holdings} />}
          {tab === "calendar" && <section className="space-y-3"><h2 className="text-2xl font-bold">Dual Event Calendar</h2>
            <div className="grid sm:grid-cols-2 gap-4">{[true, false].map((w) => (
              <Widget key={String(w)} title={w ? "⭐ My Watchlist Events" : "🌐 General Market Events"}>
                {EVENTS.filter((e) => e.watch === w).map((e) => <div key={e.title} className="flex gap-3 border-b border-dashed py-1"><b className="w-14 shrink-0">{e.date}</b>{e.title}</div>)}
              </Widget>))}</div></section>}
          {tab === "smart" && <section className="space-y-3"><h2 className="text-2xl font-bold">Smart Money & Heatmaps</h2>
            <div className="grid sm:grid-cols-2 gap-4"><Widget title="FII / DII Flows"><Flows /></Widget><Widget title="Sector Heatmap"><Heatmap /></Widget></div></section>}
          {tab === "prefs" && <section className="space-y-3"><h2 className="text-2xl font-bold">Feed Preferences</h2>
            <label className="paper-card p-3 flex items-center justify-between"><span><b>BSE/NSE Filings Only</b><br /><span className="text-xs text-muted-foreground">Only show official exchange filings</span></span><input type="checkbox" className="size-5 accent-foreground" checked={filingsOnly} onChange={(e) => setFilingsOnly(e.target.checked)} /></label>
            <label className="paper-card p-3 flex items-center justify-between"><b>Hide "Noise" stories</b><input type="checkbox" className="size-5 accent-foreground" checked={hideNoise} onChange={(e) => setHideNoise(e.target.checked)} /></label></section>}
          {tab === "voice" && <VoiceSettings />}
        </main>

        <aside className="space-y-4">
          <Widget title="🚩 Instant Red Flag Alerts">{redFlags.length ? redFlags.map((r) => <p key={r} className="text-loss text-xs">• {r}</p>) : <p>All clear.</p>}</Widget>
          <Widget title="❤️ Weekly Portfolio Health"><p className="text-4xl font-bold">{health}<span className="text-base">/100</span></p><p className="text-xs text-muted-foreground">{overTheme.length} theme & {badSize.length} sizing issues</p></Widget>
          <Widget title={hour < 15 ? "☀️ Morning Market Brief" : "🌙 Evening Market Brief"}><p className="text-xs">NIFTY {TICKERS[0]!.chg > 0 ? "opened firm" : "under pressure"}; banks led by HDFC Bank's NIM beat. L&T order win lifts infra. VIX {vix} — {noise[0].toLowerCase()} session expected.</p></Widget>
          <Widget title="💰 Smart Money FII/DII"><Flows /></Widget>
          <Widget title="🗺️ Sector Heatmap"><Heatmap /></Widget>
        </aside>
      </div>
      <footer className="text-center text-xs text-muted-foreground py-4 border-t">Sample data for demonstration. Not investment advice.</footer>
    </div>
  );
}
