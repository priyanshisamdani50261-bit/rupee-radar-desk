import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEWS } from "./data";
import { stockFor, relativeReturn } from "./stocks";
import { StockLink } from "./StockLink";
import { LiveNews } from "./LiveNews";
import type { LiveArticle } from "./rss";

const TABS = ["Thesis Health", "Knowledge Graph", "Management Scorecard", "Opportunity Cost"] as const;
export function Research({ symbol, notes }: { symbol: string; notes?: React.ReactNode }) {
  const stock = stockFor(symbol);
  const [tab, setTab] = useState<typeof TABS[number]>("Thesis Health");
  const [node, setNode] = useState((stock.name.split(" / ")[0] ?? stock.name));
  const [live, setLive] = useState<LiveArticle[]>([]);
  const related = NEWS.filter(n => (n.headline.en + n.winners.join(" ") + n.thesis).toLowerCase().includes((stock.name.split(" / ")[0] ?? stock.name).toLowerCase()) || n.winners.includes(stock.symbol));
  const groups = [{ title: "Sector", values: [stock.sector] }, { title: "Policy", values: [stock.policy] }, { title: "Upstream Suppliers", values: stock.upstream }, { title: "Downstream Customers", values: stock.downstream }];
  const filteredLive = live.filter(a => (a.title + a.summary).toLowerCase().includes(node.toLowerCase()));
  return <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
    <div className="flex justify-between items-center border-b pb-3"><Button asChild variant="ghost"><Link to="/"><ArrowLeft />Market Desk</Link></Button><span className="font-bold">MY MARKET DESK</span></div>
    <header><p className="text-xs text-muted-foreground uppercase">Stock Deep Research · {stock.sector}</p><h1 className="text-4xl font-bold py-2">{stock.name}</h1><p className="text-sm">{stock.symbol} · {stock.thesis}</p><p className="text-xs text-warn mt-2">Illustrative research framework — not verified company research or live price history.</p></header>
    <div role="tablist" aria-label="Stock research" className="grid grid-cols-2 sm:grid-cols-4 border-y-2 border-foreground">{TABS.map(t => <Button role="tab" aria-selected={tab === t} key={t} variant={tab === t ? "default" : "ghost"} className="rounded-none whitespace-normal h-auto min-h-12" onClick={() => setTab(t)}>{t}</Button>)}</div>
    <main role="tabpanel" className="space-y-5">
    {tab === "Thesis Health" && <>
      <h2 className="text-2xl font-bold">Unified Thesis Health Bar</h2>
      <div className="grid grid-cols-3 h-10 text-center text-sm font-bold"><div className="bg-gain text-primary-foreground pt-2">Strengthened</div><div className="bg-highlight pt-2 border-2 border-foreground">Neutral</div><div className="bg-loss text-primary-foreground pt-2">Broken</div></div>
      <p className="text-sm">Current assessment: <b>Neutral / unassessed</b> — fresh evidence is required.</p>
      <div className="grid md:grid-cols-2 gap-6"><section><h3 className="font-bold border-b pb-2 text-gain">Supporting Evidence</h3>{related.length ? related.map(n => <p key={n.id} className="text-sm py-2">{n.headline.en}<span className="block text-xs text-muted-foreground">Sample story · {n.verification}</span></p>) : <p className="py-2 text-sm">No verified evidence added yet.</p>}</section><section><h3 className="font-bold border-b pb-2 text-loss">Disconfirming Bear Evidence</h3><ul className="list-disc pl-5 text-sm space-y-2 pt-2"><li>Growth without cash conversion could weaken the thesis.</li><li>Debt or funding costs may offset operating gains.</li>{related.filter(n => n.bear !== "-").map(n => <li key={n.id}>{n.bear} (sample)</li>)}</ul></section></div>
      {notes}
      <section><h3 className="font-bold border-b pb-2">6–12 Month Expected Triggers</h3><div className="grid sm:grid-cols-3 gap-4 pt-3">{["Next two quarterly results", "Six-month cash-flow review", "12-month capital allocation review"].map((v,i) => <div key={v} className="border-l-2 pl-3"><p className="text-xs text-muted-foreground">{["0–6 months", "6 months", "12 months"][i]}</p><b>{v}</b><p className="text-xs">Date and target awaiting official disclosure.</p></div>)}</div></section>
    </>}
    {tab === "Knowledge Graph" && <>
      <h2 className="text-2xl font-bold">Supply Chain & Peer Knowledge Graph</h2>
      <p className="text-xs text-warn">Sector relationships are illustrative; named supplier/customer contracts have not been verified.</p>
      <div className="knowledge-map"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{groups.slice(0,2).map(g => <section key={g.title} className="space-y-2"><h3 className="text-xs uppercase font-bold">{g.title}</h3>{g.values.map(v => <Button key={v} variant={node === v ? "default" : "outline"} className="whitespace-normal w-full h-auto min-h-10" onClick={() => setNode(v)}>{v}</Button>)}</section>)}</div><div className="graph-spine" /><Button className="w-full h-14 text-lg" onClick={() => setNode((stock.name.split(" / ")[0] ?? stock.name))}>{stock.name}</Button><div className="graph-spine" /><div className="grid sm:grid-cols-2 gap-4">{groups.slice(2).map(g => <section key={g.title}><h3 className="text-xs uppercase font-bold mb-2">{g.title}</h3>{g.values.length ? g.values.map(v => <Button key={v} variant={node === v ? "default" : "outline"} className="whitespace-normal w-full h-auto min-h-10 mb-2" onClick={() => setNode(v)}>{v}</Button>) : <p className="text-sm">Not mapped</p>}</section>)}</div><div className="border-t pt-3 mt-3"><h3 className="text-xs uppercase font-bold">Peers</h3><div className="flex flex-wrap gap-4 mt-2">{stock.peers.map(p => <div key={p}><StockLink symbol={p} /><Button variant="ghost" size="sm" onClick={() => setNode(stockFor(p).name)}>News</Button></div>)}</div></div></div>
      <section><h3 className="font-bold border-b py-2">Related News · {node}</h3><LiveNews onNews={setLive} />{filteredLive.map(a => <p key={a.link} className="py-2 border-b text-sm"><a href={a.link} target="_blank" rel="noopener noreferrer" className="underline">{a.title}</a> · {a.source}</p>)}{!filteredLive.length && <p className="text-sm py-2">No matching live headlines for this node.</p>}</section>
    </>}
    {tab === "Management Scorecard" && <>
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">Unified Management Scorecard</h2><p>Credibility Score <b>Not rated / 100</b></p></div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[620px]"><thead className="border-b-2 text-left"><tr>{["Metric", "Management Hard Promise", "Analyst Estimate", "Actual Result", "Verdict"].map(v => <th className="p-3" key={v}>{v}</th>)}</tr></thead><tbody>{["Completion date", "Operating margin", "Net debt"].map(v => <tr className="border-b" key={v}><td className="p-3 font-bold">{v}</td><td className="p-3">No sourced dated commitment</td><td className="p-3">Not available</td><td className="p-3">Not available</td><td className="p-3 text-muted-foreground">Unrated</td></tr>)}</tbody></table></div>
      <section className="border-t pt-4"><h3 className="font-bold">Post-Earnings Call Insights</h3><p className="text-sm mt-2">No sourced earnings-call transcript attached.</p><p className="text-xs text-muted-foreground mt-2">Only measurable dated commitments count. Vague statements are excluded; no credibility score is invented.</p></section>
    </>}
    {tab === "Opportunity Cost" && <Opportunity />}
    </main>
  </div>;
}
function Opportunity() {
  const [period, setPeriod] = useState("12M");
  const rows = period === "6M" ? [{ label: "Stock", value: 6.4 }, { label: "NIFTY 50", value: 8.2 }, { label: "Sector", value: 7.1 }] : [{ label: "Stock", value: 12.8 }, { label: "NIFTY 50", value: 16.4 }, { label: "Sector", value: 14.2 }];
  return <><div className="flex justify-between flex-wrap gap-3"><h2 className="text-2xl font-bold">Opportunity Cost Tracker</h2><div className="flex">{["6M", "12M"].map(p => <Button key={p} variant={p === period ? "default" : "outline"} onClick={() => setPeriod(p)}>{p}</Button>)}</div></div><p className="text-xs text-warn">Illustrative returns only · price-return comparison, excluding dividends and fees.</p><figure aria-label="Sample return comparison" className="space-y-5 py-6 border-y">{rows.map((r,i) => <div key={r.label} className="grid grid-cols-[85px_1fr_55px] gap-3 items-center text-sm"><b>{r.label}</b><div className="bg-muted h-8"><div className={`h-8 ${["bg-chart-1", "bg-chart-3", "bg-chart-4"][i]}`} style={{ width: `${r.value / 20 * 100}%` }} /></div><b>{r.value}%</b></div>)}<figcaption className="text-xs text-muted-foreground">Common starting point · {period} sample period</figcaption></figure><table className="w-full text-sm"><thead className="text-left border-b-2"><tr><th className="py-3">Investment</th><th>Return</th><th>Stock relative return</th></tr></thead><tbody>{rows.map(r => <tr className="border-b" key={r.label}><td className="py-3 font-bold">{r.label}</td><td>{r.value}%</td><td className={r.label === "Stock" ? "" : "text-loss"}>{relativeReturn((rows[0]?.value ?? 0),r.value).toFixed(1)} pp</td></tr>)}</tbody></table></>;
}