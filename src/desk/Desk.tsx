import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAccount } from "./account";
import { AccountButton, usePrivatePortfolio } from "./PrivateData";
import { useMarket, MarketTicker, LiveHeatmap } from "./Market";
import { HealthReview, EventCalendar, SmartMoney } from "./DeskWidgets";
import { voiceRank } from "./pronunciation";
import type { ArchivedArticle } from "./news-model";
import { Button } from "@/components/ui/button";
import { StockLink } from "./StockLink";
import { STOCKS } from "./stocks";
import { LiveNews } from "./LiveNews";
import { EVENTS, FLOWS, NEWS, SECTORS, SEED_HOLDINGS, TICKERS, THEME_LIMIT, sizingVerdict, tr, type Holding, type Lang } from "./data";
import { NewsCard } from "./NewsCard";
import { Portfolio, ThemeExposure, themeWeights } from "./Portfolio";
import { useSpeaker, useVoices } from "./speech";
import { translatedFor, useTranslations } from "./translation";

type Tab = "command" | "portfolio" | "themes" | "calendar" | "smart" | "prefs" | "voice" | "health";
const TABS: Tab[] = ["command", "portfolio", "themes", "calendar", "smart", "prefs"];

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="paper-card p-3"><h4 className="font-bold border-b-2 border-foreground mb-2 pb-1">{title}</h4><div className="text-sm space-y-1">{children}</div></section>;
}

function VoiceSettings() {
  const voices = useVoices(); const sp = useSpeaker();
  const [sel, setSel] = useState("");
  useEffect(() => setSel(localStorage.getItem("mmd-voice") || ""), []);
  const pick = (n: string) => { setSel(n); localStorage.setItem("mmd-voice", n); };
  const sample = (v: SpeechSynthesisVoice) => v.lang.startsWith("hi") ? "नमस्ते, आज निफ्टी में हल्की तेज़ी है।" : "Good morning. Nifty is trading slightly higher today.";
  const sorted = [...voices].sort((a,b) => voiceRank(b)-voiceRank(a));
  return (
    <section className="space-y-3"><h2 className="text-2xl font-bold">🎙️ Voice Settings</h2>
      <p className="text-sm text-muted-foreground">Hindi & Indian English voices are listed first. Test one, then pick it — all Listen buttons will use it.</p>
      {sorted.length === 0 && <p>No voices found on this device/browser.</p>}
      {sorted.map((v) => (
        <div key={v.name} className={`paper-card p-3 flex flex-wrap items-center gap-3 ${sel === v.name ? "ring-2 ring-foreground" : ""}`}>
          <div className="flex-1"><b>{v.name}</b> <span className="text-xs text-muted-foreground">{v.lang}</span></div>
          <Button variant="ghost" className="border px-2 py-1 text-sm" onClick={() => { pick(v.name); sp.play(sample(v)); }}>▶ Test</Button>
          <Button variant="ghost" className="bg-primary text-primary-foreground px-2 py-1 text-sm" onClick={() => pick(v.name)}>{sel === v.name ? "✓ Selected" : "Use"}</Button>
        </div>))}
    </section>
  );
}

export function Desk() {
  const [lang, setLang] = useState<Lang>("hinglish");
  const [tab, setTab] = useState<Tab>("command");
  const [filingsOnly, setFilingsOnly] = useState(false);
  const [hideNoise, setHideNoise] = useState(false);
  const { user } = useAccount();
  const privatePortfolio = usePrivatePortfolio();
  const holdings = privatePortfolio.holdings;
  const setHoldings = privatePortfolio.setHoldings;
  const market = useMarket();
  const quotes = market.data?.quotes ?? [];
  const [sector,setSector] = useState("All Sectors");
  const [signalsOnly,setSignalsOnly] = useState(false);
  const [industries,setIndustries] = useState<Record<string,boolean>>({});
  const [articles,setArticles] = useState<ArchivedArticle[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const brief = useSpeaker();
  // Make sure the top Signal stories (used by the audio brief + sidebar) are translated into the selected language.
  useTranslations(articles.filter(a => a.enrichment?.tag === "Signal").slice(0, 8), lang);
  useEffect(() => { const key = (e:KeyboardEvent) => { const target = e.target as HTMLElement; if ((e.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(target.tagName)) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); searchRef.current?.focus(); } }; document.addEventListener("keydown",key); return () => document.removeEventListener("keydown",key); },[]);
  const filterSector = (s:string) => {setSector(s);setTab("command");};


  const vix = quotes.find(q => q.name === "INDIA VIX")?.value;
  const noise: [string,number] = vix == null ? ["Unavailable",0] : vix < 13 ? ["Calm",25] : vix < 18 ? ["Moderate",55] : ["High Noise",85];
  const changed = articles.filter(a => a.enrichment?.tag === "Signal").length;

  const { m } = themeWeights(holdings); const total = holdings.reduce((s, x) => s + x.qty * x.ltp, 0) || 1;
  const overTheme = Object.entries(m).filter(([, w]) => w > THEME_LIMIT);
  const badSize = holdings.filter((h) => h.kind !== "watchlist" && sizingVerdict((h.qty * h.ltp * 100) / total, h.conviction) !== "OK");
  const health = Math.max(0, 100 - overTheme.length * 15 - badSize.length * 8);
  const redFlags = [...badSize.map(h=>({symbol:h.symbol,text:`${h.symbol}: position size off-target`})),...holdings.filter(h=>h.kind==="watchlist" && h.preMortem).map(h=>({symbol:h.symbol,text:`${h.symbol}: watch ${h.preMortem}`}))];
  const [hour,setHour] = useState(9);
  const [today,setToday] = useState("");
  useEffect(() => { const update = () => { const now = new Date(); setHour(Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",hourCycle:"h23"}).format(now))); setToday(now.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",year:"numeric"})); }; update(); const timer=setInterval(update,60000);return()=>clearInterval(timer); },[]);
  const briefText = (lang === "hi" ? `बाज़ार सार। NIFTY ${quotes.find(q=>q.name==="NIFTY 50")?.value ?? "अनुपलब्ध"}। VIX ${vix ?? "अनुपलब्ध"}। ` : lang === "hinglish" ? `Market brief. NIFTY ${quotes.find(q=>q.name==="NIFTY 50")?.value ?? "unavailable"} par hai. VIX ${vix ?? "unavailable"}. ` : `Market brief. NIFTY ${quotes.find(q=>q.name==="NIFTY 50")?.value ?? "unavailable"}. VIX ${vix ?? "unavailable"}. `) + articles.filter(a=>a.enrichment?.tag==="Signal").slice(0,8).map(a=> {const t=translatedFor(a,lang);return `${t?.headline ?? a.title}. ${t?.tldr.join(". ") ?? a.summary}`;}).join(". ");


  return (
    <div className="min-h-screen">
      <header className="px-4 pt-3 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Button variant="ghost" className="lg:hidden border px-2 py-1" onClick={() => setMenu(!menu)}>☰ Menu</Button>
          <span className="text-muted-foreground">{today}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <AccountButton />
            <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="border px-2 py-1 bg-background">
              <option value="hinglish">Hinglish</option><option value="hi">शुद्ध हिंदी</option><option value="en">Pure English</option></select>
            <Button variant="ghost" onClick={() => setTab("voice")} className={`border px-2 py-1 ${tab === "voice" ? "bg-primary text-primary-foreground" : ""}`}>{tr("voice", lang)}</Button>
            <Button variant="ghost" onClick={() => (brief.state === "idle" ? brief.play(briefText, lang) : brief.stop())} className="bg-primary text-primary-foreground px-2 py-1 font-bold">{brief.state === "idle" ? tr("brief", lang) : "⏹ Stop Brief"}</Button>
          </div>
        </div>
        <div className="relative max-w-md mx-auto mt-3"><input ref={searchRef} aria-label="Search stocks" placeholder="Search stock name or symbol" className="border bg-background px-3 py-2 w-full text-sm" value={search} onChange={e => setSearch(e.target.value)} />{search.trim() && <div className="absolute z-30 w-full border bg-background p-3 space-y-2">{STOCKS.filter(s => (s.symbol + s.name).toLowerCase().includes(search.toLowerCase())).map(s => <div key={s.symbol}><StockLink symbol={s.symbol} label={`${s.name} · ${s.symbol}`} /></div>)}{!STOCKS.some(s => (s.symbol + s.name).toLowerCase().includes(search.toLowerCase())) && <StockLink symbol={search} label={`Research ${search.toUpperCase()}`} />}</div>}</div>
        <h1 className="text-center text-4xl sm:text-6xl font-bold tracking-tight py-2">MY MARKET DESK</h1>
        <div className="rule-double" />
        <p className="text-center text-xs italic text-muted-foreground py-1">Indian Markets · Signal over Noise · Est. 2026</p>
      </header>
      <MarketTicker quotes={quotes} />
      <p className="max-w-[1400px] mx-auto px-4 text-xs text-muted-foreground py-1">Yahoo Finance · Last available quotes {market.data ? new Date(market.data.fetchedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}) + " IST" : "pending"} · Market-hours sync while this tab is visible.</p>
      <div className="max-w-[1400px] mx-auto px-4 py-2 flex flex-wrap gap-4 text-sm border-b">
        <span>📰 <b>{tr("changed", lang)}</b> <Button variant="ghost" size="sm" className="bg-highlight font-bold" onClick={()=>{setSignalsOnly(!signalsOnly);setTab("command");}}>{changed} key changes</Button> · {articles.length} stories tracked</span>
        <span className="flex items-center gap-2 ml-auto">🔊 <b>{tr("noise", lang)}</b>
          <span className="w-32 h-2 bg-muted inline-block"><span className={`block h-2 ${Number(noise[1]) > 70 ? "bg-loss" : Number(noise[1]) > 40 ? "bg-warn" : "bg-gain"}`} style={{ width: `${noise[1]}%` }} /></span>
          {noise[0]} (VIX {vix?.toFixed(2) ?? "—"})</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-4 grid gap-4 lg:grid-cols-[200px_1fr_300px]">
        <nav className={`${menu ? "block" : "hidden"} lg:block`}>
          <ul className="space-y-1 lg:sticky lg:top-4">{TABS.map((k) => (
            <li key={k}><Button variant="ghost" onClick={() => { setTab(k); setMenu(false); }} className={`w-full text-left px-3 py-2 border-l-4 ${tab === k ? "border-foreground bg-accent font-bold" : "border-transparent hover:bg-muted"}`}>{tr(k, lang)}</Button></li>))}</ul>
        </nav>

        <main className="space-y-4 min-w-0">
          {tab === "command" && <>
            <h2 className="text-2xl font-bold border-b-2 border-foreground">{tr("command", lang)}</h2>
            {(sector !== "All Sectors" || signalsOnly) && <div className="flex items-center gap-2 text-sm"><span>{sector} {signalsOnly ? "· Signal stories" : ""}</span><Button variant="link" size="sm" onClick={()=>{setSector("All Sectors");setSignalsOnly(false);}}>Clear Filter</Button></div>}
            <LiveNews lang={lang} holdings={holdings} sector={sector} setSector={setSector} signalsOnly={signalsOnly} filingsOnly={filingsOnly} hideNoise={hideNoise} industries={industries} onArticles={setArticles} />
          </>}
          {tab === "portfolio" && (user ? <>{privatePortfolio.loading ? <p>Loading private portfolio…</p> : <Portfolio key={user.id} holdings={holdings} setHoldings={setHoldings} />}{privatePortfolio.saving && <p role="status">Saving private portfolio…</p>}{privatePortfolio.error && <p role="alert" className="text-loss">Private portfolio could not be loaded or saved. Try again.</p>}</> : <section><h2 className="text-2xl font-bold mb-4">My Private Portfolio & Watchlist</h2><Button asChild><Link to="/auth">Sign in to view your private stocks</Link></Button></section>)}
          {tab === "themes" && <ThemeExposure holdings={holdings} />}
          {tab === "calendar" && <EventCalendar articles={articles} holdings={holdings} />}
          {tab === "smart" && <><SmartMoney holdings={holdings} /><LiveHeatmap quotes={quotes} onSector={filterSector} /></>}
          {tab === "health" && <HealthReview holdings={holdings} />}
          {tab === "prefs" && <section className="space-y-3"><h2 className="text-2xl font-bold">Feed Preferences</h2>
            <label className="border-b p-3 flex items-center justify-between"><span><b>BSE/NSE Filings Only</b></span><input type="checkbox" className="size-5 accent-foreground" checked={filingsOnly} onChange={(e) => setFilingsOnly(e.target.checked)} /></label>
            <label className="border-b p-3 flex items-center justify-between"><b>Hide Noise stories</b><input type="checkbox" className="size-5 accent-foreground" checked={hideNoise} onChange={(e) => setHideNoise(e.target.checked)} /></label>
            {["Defence","Banking","IT","Auto","Pharma","Semiconductors","Textiles"].map(i=><div key={i} className="flex justify-between border-b py-2 text-sm"><b>{i}</b><Button variant="outline" size="sm" onClick={()=>setIndustries({...industries,[i]:industries[i]===false})}>{industries[i]===false ? "+ Show More" : "− Hide"}</Button></div>)}
            <p className="text-xs text-muted-foreground">Direct feed blocks are reported in Refresh details; no proxy bypasses or social rumours are used.</p></section>}

          {tab === "voice" && <VoiceSettings />}
        </main>

        <aside className="space-y-4">
          <Widget title="🚩 Instant Red Flag Alerts">{user ? <>{redFlags.map(r=><p key={r.symbol+r.text} className="text-loss text-xs"><StockLink symbol={r.symbol} label={r.text}/></p>)}{overTheme.map(([t,w])=><Button key={t} variant="link" className="text-loss text-xs whitespace-normal h-auto" onClick={()=>setTab("health")}>{t} theme at {w.toFixed(0)}% (&gt;35%)</Button>)}{!redFlags.length && !overTheme.length && <p>No portfolio rule flags.</p>}</> : <p>Sign in for private stock alerts.</p>}</Widget>
          <Widget title="❤️ Weekly Portfolio Health"><Button variant="ghost" className="h-auto text-4xl font-bold p-0" onClick={()=>setTab("health")}>{user ? health : "—"}<span className="text-base">/100</span></Button><p className="text-xs text-muted-foreground">{overTheme.length} theme & {badSize.length} sizing issues</p></Widget>
          <Widget title={hour < 15 ? "☀️ Morning Market Brief" : "🌙 Evening Market Brief"}><p className="text-xs">{lang==="hi" ? "NIFTY और VIX का नवीनतम उपलब्ध सार।" : lang==="hinglish" ? "NIFTY aur VIX ka latest available brief." : "Latest available NIFTY and VIX brief."}</p>{articles.filter(a=>a.enrichment?.tag==="Signal").slice(0,3).map(a=><a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" className="block underline text-xs">{translatedFor(a,lang)?.headline ?? a.title} ↗</a>)}<div className="flex flex-wrap gap-2 text-xs">{holdings.slice(0,5).map(h=><StockLink key={h.id} symbol={h.symbol}/>)}</div>{brief.error && <p className="text-xs text-muted-foreground">{brief.error}</p>}</Widget>
          <Widget title="💰 Smart Money FII/DII"><Button variant="link" onClick={()=>setTab("smart")}>Cash / Index F&O / Stock F&O</Button><p className="text-xs text-muted-foreground">Source-backed institutional figures only.</p></Widget>
          <Widget title="🗺️ Sector Heatmap"><LiveHeatmap quotes={quotes} onSector={filterSector}/></Widget>
        </aside>
      </div>
      <footer className="text-center text-xs text-muted-foreground py-4 border-t">Publisher headlines and Yahoo quotes may be delayed. AI analysis is not investment advice.</footer>
    </div>
  );
}
