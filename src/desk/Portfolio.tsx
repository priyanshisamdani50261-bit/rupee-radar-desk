import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { StockLink } from "./StockLink";
import { SymbolSearch, type StockHit } from "./SymbolSearch";
import { lookupLtp } from "./stocksearch.functions";
import { THEME_LIMIT, sizingRange, sizingVerdict, taxStatus, type Holding } from "./data";

const blank: Holding = { id: "", kind:"holding", symbol: "", theme: "", qty: 0, buyPrice: 0, ltp: 0, buyDate: "", conviction: "Med", reason: "", preMortem: "" };

export function themeWeights(h: Holding[]) {
  h = h.filter(x => x.kind !== "watchlist");
  const total = h.reduce((s, x) => s + x.qty * x.ltp, 0) || 1;
  const m: Record<string, number> = {};
  h.forEach((x) => (m[x.theme] = (m[x.theme] || 0) + (x.qty * x.ltp * 100) / total));
  return { total, m };
}

export function Portfolio({ holdings, setHoldings }: { holdings: Holding[]; setHoldings: (h: Holding[]) => void }) {
  const [edit, setEdit] = useState<Holding | null>(null);
  const [error,setError] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const getLtp = useServerFn(lookupLtp);
  const { total } = themeWeights(holdings);

  // One click on a suggestion: fills Symbol, Theme / Sector and (for holdings) the live LTP.
  const pickStock = async (hit: StockHit) => {
    const isHolding = (edit?.kind ?? "holding") !== "watchlist";
    setError("");
    setEdit((prev) => prev ? { ...prev, symbol: hit.symbol, theme: hit.sector || prev.theme } : prev);
    if (!isHolding) { setPriceNote(""); return; }
    setPriceNote("Fetching live price…");
    try {
      const { price } = await getLtp({ data: { symbol: hit.yahooSymbol } });
      if (price == null) { setPriceNote("Live price unavailable — enter LTP manually."); return; }
      setEdit((prev) => prev && prev.symbol === hit.symbol ? { ...prev, ltp: price } : prev);
      setPriceNote(`Live price ₹${price.toLocaleString("en-IN")} filled from Yahoo Finance (may be delayed).`);
    } catch {
      setPriceNote("Live price unavailable — enter LTP manually.");
    }
  };

  const save = () => {
    if (!edit) return;
    // Only the symbol is mandatory now. Conviction, Reason and Pre-Mortem are optional.
    if (!edit.symbol.trim()) {setError("Enter or search for a stock symbol.");return;}
    if(edit.kind !== "watchlist" && (!edit.buyDate || edit.qty <= 0 || edit.buyPrice <= 0)) {setError("Holdings need a positive quantity, buy price and buy date.");return;}
    setError("");
    const isWatch = edit.kind === "watchlist";
    const h: Holding = {
      ...edit,
      ...(isWatch ? { qty: 0, buyPrice: 0, ltp: 0, buyDate: "" } : { ltp: edit.ltp > 0 ? edit.ltp : edit.buyPrice }),
      symbol: edit.symbol.trim().toUpperCase(),
      theme: edit.theme.trim() || "Unclassified",
      conviction: edit.conviction || "Med",
      reason: edit.reason.trim(),
      preMortem: edit.preMortem.trim(),
      id: edit.id || crypto.randomUUID(),
    };
    setHoldings(edit.id ? holdings.map((x) => (x.id === h.id ? h : x)) : [...holdings, h]);
    setEdit(null); setPriceNote("");
  };
  const f = (k: keyof Holding, type = "text", label?: string) => (
    <label className="text-xs flex flex-col gap-1 capitalize">{label ?? k.replace(/([A-Z])/g, " $1")}
      <input type={type} className="border px-2 py-1 text-sm bg-background" value={String(edit?.[k] ?? "")}
        onChange={(e) => edit && setEdit({ ...edit, [k]: type === "number" ? Number(e.target.value) : e.target.value })} />
    </label>
  );
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">My Portfolio</h2>
        <Button onClick={() => { setPriceNote(""); setError(""); setEdit({ ...blank, buyDate:new Date().toISOString().slice(0,10) }); }}>+ Add / Edit Stock</Button></div>
      <p className="text-sm text-muted-foreground">Total value ₹{Math.round(total).toLocaleString("en-IN")} · Sizing guide: High {sizingRange.High.join("-")}% · Med {sizingRange.Med.join("-")}% · Low {sizingRange.Low.join("-")}%</p>
      {edit && (
        <div className="paper-card p-4 grid sm:grid-cols-3 gap-3">
          <label className="sm:col-span-3 text-xs flex flex-col gap-1">Type<select aria-label="Stock Type" className="border bg-background p-2" value={edit.kind ?? "holding"} onChange={e => setEdit({...edit,kind:e.target.value as "holding"|"watchlist"})}><option value="holding">Portfolio Holding</option><option value="watchlist">Watchlist Stock</option></select></label>
          <SymbolSearch value={edit.symbol} onChange={(symbol) => setEdit({ ...edit, symbol })} onPick={pickStock} />
          {f("theme", "text", "Theme / Sector")}
          {edit.kind !== "watchlist" && <>{f("qty", "number")}{f("buyPrice", "number")}{f("ltp", "number", "LTP (live price)")}{f("buyDate", "date")}</>}
          <label className="text-xs flex flex-col gap-1">Conviction (optional)
            <select className="border px-2 py-1 text-sm bg-background" value={edit.conviction} onChange={(e) => setEdit({ ...edit, conviction: e.target.value as Holding["conviction"] })}>
              <option>High</option><option>Med</option><option>Low</option></select></label>
          {f("reason", "text", "Buying reason (optional)")}{f("preMortem", "text", "Pre-mortem failure risks (optional)")}
          {priceNote && <p role="status" className="sm:col-span-3 text-xs text-muted-foreground">{priceNote}</p>}
          {error && <p role="alert" className="sm:col-span-3 text-loss text-sm">{error}</p>}
          <div className="sm:col-span-3 flex gap-2"><Button variant="ghost" onClick={save} className="bg-primary text-primary-foreground px-3 py-1 font-bold">Save</Button><Button variant="ghost" onClick={() => { setEdit(null); setPriceNote(""); }} className="border px-3 py-1">Cancel</Button></div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b-2 border-foreground text-left"><th className="p-2">Stock</th><th>Weight</th><th>Sizing</th><th>P&L</th><th>Tax Check</th><th>Why / Pre-Mortem</th><th></th></tr></thead>
          <tbody>{holdings.filter(h => h.kind !== "watchlist").map((h) => {
            const w = (h.qty * h.ltp * 100) / total; const v = sizingVerdict(w, h.conviction); const t = taxStatus(h.buyDate);
            const pnl = (h.ltp - h.buyPrice) * h.qty;
            return (
              <tr key={h.id} className="border-b align-top">
                <td className="p-2"><StockLink symbol={h.symbol} /><div className="text-xs text-muted-foreground">{h.theme} · {h.conviction}</div></td>
                <td className="p-2">{w.toFixed(1)}%</td>
                <td className={`p-2 font-bold ${v === "OK" ? "text-gain" : "text-loss"}`}>{v}<div className="text-xs font-normal text-muted-foreground">target {sizingRange[h.conviction].join("-")}%</div></td>
                <td className={`p-2 ${pnl >= 0 ? "text-gain" : "text-loss"}`}>₹{Math.round(pnl).toLocaleString("en-IN")}</td>
                <td className="p-2"><b>{t.type}</b> @{t.rate}%{t.type === "STCG" && <div className={`text-xs ${t.daysToLtcg <= 30 ? "text-loss font-bold" : "text-warn"}`}>{t.daysToLtcg <= 30 && "LTCG Countdown: "}{t.daysToLtcg} days to LTCG</div>}</td>
                <td className="p-2 text-xs">{h.reason || <span className="text-muted-foreground">—</span>}{h.preMortem && <div className="text-loss">⚠ {h.preMortem}</div>}</td>
                <td className="p-2 whitespace-nowrap"><Button variant="ghost" className="underline" onClick={() => { setPriceNote(""); setError(""); setEdit(h); }}>Edit</Button> <Button variant="ghost" className="underline text-loss" onClick={() => setHoldings(holdings.filter((x) => x.id !== h.id))}>✕</Button></td>
              </tr>);
          })}</tbody>
        </table>
      </div>
      <h3 className="text-xl font-bold border-b-2 pb-2">My Watchlist</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left border-b"><tr><th className="p-2">Stock</th><th>Theme</th><th>Conviction</th><th>Reason / Pre-Mortem</th><th /></tr></thead><tbody>{holdings.filter(h=>h.kind==="watchlist").map(h=><tr key={h.id} className="border-b"><td className="p-2"><StockLink symbol={h.symbol}/></td><td>{h.theme}</td><td>{h.conviction}</td><td className="p-2">{h.reason || <span className="text-muted-foreground">—</span>}{h.preMortem && <div className="text-loss text-xs">{h.preMortem}</div>}</td><td><Button variant="link" onClick={()=>{ setPriceNote(""); setError(""); setEdit(h); }}>Edit</Button><Button variant="link" aria-label={`Remove ${h.symbol}`} onClick={()=>setHoldings(holdings.filter(x=>x.id!==h.id))}>✕</Button></td></tr>)}</tbody></table>{!holdings.some(h=>h.kind==="watchlist") && <p className="text-muted-foreground text-sm py-3">No watchlist stocks yet.</p>}</div>
    </section>
  );
}

export function ThemeExposure({ holdings }: { holdings: Holding[] }) {
  const { m } = themeWeights(holdings);
  return (
    <section className="space-y-3"><h2 className="text-2xl font-bold">Theme Exposure</h2>
      {Object.entries(m).sort((a, b) => b[1] - a[1]).map(([t, w]) => (
        <div key={t} className="paper-card p-3">
          <div className="flex justify-between text-sm"><b>{t}</b><span>{w.toFixed(1)}%</span></div>
          <div className="h-3 bg-muted mt-1 relative"><div className={`h-3 ${w > THEME_LIMIT ? "bg-loss" : "bg-primary"}`} style={{ width: `${w}%` }} />
            <div className="absolute top-0 h-3 w-0.5 bg-warn" style={{ left: `${THEME_LIMIT}%` }} /></div>
          <div className="flex flex-wrap gap-3 mt-2 text-sm">{holdings.filter(h => h.theme === t).map(h => <StockLink key={h.id} symbol={h.symbol} />)}</div>
          {w > THEME_LIMIT && <p className="text-loss text-xs mt-1 font-bold">⚠ Concentration warning: above {THEME_LIMIT}% in one theme.</p>}
        </div>))}
      <h3 className="font-bold border-t pt-3">Watchlist Themes · Unweighted</h3>{[...new Set(holdings.filter(h=>h.kind==="watchlist").map(h=>h.theme))].map(t=><div key={t} className="flex flex-wrap gap-3 text-sm"><b>{t}</b>{holdings.filter(h=>h.kind==="watchlist" && h.theme===t).map(h=><StockLink key={h.id} symbol={h.symbol}/>)}</div>)}
    </section>
  );
}
