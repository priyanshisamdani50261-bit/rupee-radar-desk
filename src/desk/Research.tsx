import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stockFor } from "./stocks";
import { StockLink } from "./StockLink";
import { LiveNews } from "./LiveNews";
import { Opportunity } from "./Opportunity";
import { useResearchData, ManagementScorecard } from "./ResearchTools";
import { useAccount } from "./account";
import { AccountButton } from "./PrivateData";

const TABS = ["Thesis Health", "Knowledge Graph", "Management Scorecard", "Opportunity Cost"] as const;
export function Research({ symbol, notes }: { symbol: string; notes?: React.ReactNode }) {
  const stock = stockFor(symbol);
  const { user } = useAccount();
  const { query, mutation } = useResearchData(stock.symbol);
  const research = query.data?.research;
  const [tab, setTab] = useState<typeof TABS[number]>("Thesis Health");
  const [node, setNode] = useState(stock.name.split(" / ")[0] ?? stock.name);
  const [compare, setCompare] = useState(false);
  const [peer, setPeer] = useState(stock.peers[0] ?? "");
  const peers = [...new Set([...stock.peers, ...(research?.peers ?? [])])];
  const groups = [{ title: "Sector", values: [stock.sector] }, { title: "Policy", values: research?.policies.length ? research.policies : [stock.policy] }, { title: "Upstream Suppliers", values: research?.upstream ?? [] }, { title: "Downstream Customers", values: research?.downstream ?? [] }];
  const broken = Boolean(query.data?.triggers.length);
  return <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
    <div className="flex justify-between items-center border-b pb-3"><Button asChild variant="ghost"><Link to="/"><ArrowLeft />Market Desk</Link></Button><span className="font-bold">MY MARKET DESK</span><AccountButton /></div>
    <header><p className="text-xs text-muted-foreground uppercase">Stock Deep Research · {stock.sector}</p><h1 className="text-4xl font-bold py-2">{stock.name}</h1><p className="text-sm">{stock.symbol} · {stock.thesis}</p><p className="text-xs text-muted-foreground mt-2">Source-backed excerpts and your private assessments; no invented company forecasts.</p></header>
    <div className="flex gap-3 flex-wrap items-center"><Button variant="outline" disabled={!user || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Updating from source archive…" : "Refresh AI Research"}</Button><Button variant="outline" aria-pressed={compare} onClick={() => setCompare(!compare)}>+ Compare Peer</Button>{compare && <select aria-label="Compare peer" value={peer} className="border bg-background p-2 text-sm" onChange={e => setPeer(e.target.value)}><option value="">Choose peer</option>{peers.map(p => <option key={p} value={p}>{stockFor(p).name}</option>)}</select>}</div>
    {mutation.error && <p role="alert" className="text-loss text-sm">{mutation.error.message}</p>}
    {compare && peer && <section className="border-y py-3 grid sm:grid-cols-2 gap-3 text-sm"><div><b>{stock.name}</b><p>{stock.sector} · {stock.thesis}</p></div><div><StockLink symbol={peer} label={stockFor(peer).name} /><p>{stockFor(peer).sector} · {stockFor(peer).thesis}</p></div></section>}
    <div role="tablist" aria-label="Stock research" className="grid grid-cols-2 sm:grid-cols-4 border-y-2 border-foreground">{TABS.map(t => <Button role="tab" aria-selected={tab === t} key={t} variant={tab === t ? "default" : "ghost"} className="rounded-none whitespace-normal h-auto min-h-12" onClick={() => setTab(t)}>{t}</Button>)}</div>
    <main role="tabpanel" className="space-y-5">
    {tab === "Thesis Health" && <>
      <h2 className="text-2xl font-bold">Unified Thesis Health Bar</h2>
      <div className="grid grid-cols-3 min-h-10 text-center text-sm font-bold"><div className="bg-gain text-primary-foreground py-2">Strengthened</div><div className={`bg-highlight py-2 ${!broken ? "border-2 border-foreground" : ""}`}>Neutral</div><div className={`bg-loss text-primary-foreground py-2 ${broken ? "border-2 border-foreground" : ""}`}>Broken</div></div>
      <p className="text-sm">Current assessment: <b>{broken ? "Active sell trigger" : "Neutral / unassessed"}</b></p>
      <div className="grid md:grid-cols-2 gap-6">{[{ title: "Supporting Evidence", items: research?.supporting ?? [], cls: "text-gain" }, { title: "Disconfirming Bear Evidence", items: research?.bearish ?? [], cls: "text-loss" }].map(g => <section key={g.title}><h3 className={`font-bold border-b pb-2 ${g.cls}`}>{g.title}</h3>{g.items.map((e,i) => <p key={i} className="text-sm py-2">{e.text} <a href={e.source} target="_blank" rel="noopener noreferrer" className="underline text-xs">Source ↗</a></p>)}{!g.items.length && <p className="text-sm text-muted-foreground py-3">No sourced evidence saved yet.</p>}</section>)}</div>
      {notes}
      <section><h3 className="font-bold border-b pb-2">6–12 Month Expected Triggers</h3>{research?.triggers.length ? research.triggers.map((t,i) => <p className="text-sm py-2" key={i}><b>{t.date}</b> · {t.text} <a href={t.source} className="underline" target="_blank" rel="noopener noreferrer">Source ↗</a></p>) : <p className="text-sm text-muted-foreground py-3">No explicitly dated future triggers in the saved source coverage.</p>}</section>
    </>}
    {tab === "Knowledge Graph" && <>
      <h2 className="text-2xl font-bold">Supply Chain & Peer Knowledge Graph</h2>
      <div className="knowledge-map"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{groups.slice(0,2).map(g => <section key={g.title} className="space-y-2"><h3 className="text-xs uppercase font-bold">{g.title}</h3>{g.values.map(v => <Button key={v} variant={node === v ? "default" : "outline"} className="whitespace-normal w-full h-auto min-h-10" onClick={() => setNode(v)}>{v}</Button>)}</section>)}</div><div className="graph-spine" /><Button className="w-full h-14 text-lg" onClick={() => setNode(stock.name.split(" / ")[0] ?? stock.name)}>{stock.name}</Button><div className="graph-spine" /><div className="grid sm:grid-cols-2 gap-4">{groups.slice(2).map(g => <section key={g.title}><h3 className="text-xs uppercase font-bold mb-2">{g.title}</h3>{g.values.length ? g.values.map(v => <Button key={v} variant={node === v ? "default" : "outline"} className="whitespace-normal w-full h-auto min-h-10 mb-2" onClick={() => setNode(v)}>{v}</Button>) : <p className="text-sm text-muted-foreground">No sourced named relationships</p>}</section>)}</div><div className="border-t pt-3 mt-3"><h3 className="text-xs uppercase font-bold">Peers</h3><div className="flex flex-wrap gap-4 mt-2">{peers.map(p => <div key={p}><StockLink symbol={p} /><Button variant="ghost" size="sm" onClick={() => setNode(stockFor(p).name)}>News</Button></div>)}</div></div></div>
      <section><h3 className="font-bold border-b py-2">Related News · {node}</h3><LiveNews node={node} /></section>
    </>}
    {tab === "Management Scorecard" && <ManagementScorecard symbol={stock.symbol} />}
    {tab === "Opportunity Cost" && <><Opportunity symbol={stock.symbol} sector={stock.sector === "Banking" ? "Bank" : stock.sector === "Infrastructure" ? "Infra" : stock.sector} />{compare && peer && <><h3 className="text-xl font-bold">Peer · {stockFor(peer).name}</h3><Opportunity symbol={peer} sector={stockFor(peer).sector === "Banking" ? "Bank" : stockFor(peer).sector} /></>}</>}
    </main>
  </div>;
}
