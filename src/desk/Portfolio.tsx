import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StockLink } from "./StockLink";
import { THEME_LIMIT, sizingRange, sizingVerdict, taxStatus, type Holding } from "./data";

const blank: Holding = { id: "", symbol: "", theme: "", qty: 0, buyPrice: 0, ltp: 0, buyDate: new Date().toISOString().slice(0, 10), conviction: "Med", reason: "", preMortem: "" };

export function themeWeights(h: Holding[]) {
  const total = h.reduce((s, x) => s + x.qty * x.ltp, 0) || 1;
  const m: Record<string, number> = {};
  h.forEach((x) => (m[x.theme] = (m[x.theme] || 0) + (x.qty * x.ltp * 100) / total));
  return { total, m };
}

export function Portfolio({ holdings, setHoldings }: { holdings: Holding[]; setHoldings: (h: Holding[]) => void }) {
  const [edit, setEdit] = useState<Holding | null>(null);
  const { total } = themeWeights(holdings);
  const save = () => {
    if (!edit || !edit.symbol) return;
    const h = { ...edit, symbol: edit.symbol.toUpperCase(), id: edit.id || crypto.randomUUID() };
    setHoldings(edit.id ? holdings.map((x) => (x.id === h.id ? h : x)) : [...holdings, h]);
    setEdit(null);
  };
  const f = (k: keyof Holding, type = "text") => (
    <label className="text-xs flex flex-col gap-1 capitalize">{k.replace(/([A-Z])/g, " $1")}
      <input type={type} className="border px-2 py-1 text-sm bg-background" value={String(edit?.[k] ?? "")}
        onChange={(e) => edit && setEdit({ ...edit, [k]: type === "number" ? Number(e.target.value) : e.target.value })} />
    </label>
  );
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">My Portfolio</h2>
        <Button variant="ghost" onClick={() => setEdit({ ...blank })} className="bg-primary text-primary-foreground px-3 py-1.5 font-bold">+ Add/Edit Stock</Button></div>
      <p className="text-sm text-muted-foreground">Total value ₹{Math.round(total).toLocaleString("en-IN")} · Sizing guide: High {sizingRange.High.join("-")}% · Med {sizingRange.Med.join("-")}% · Low {sizingRange.Low.join("-")}%</p>
      {edit && (
        <div className="paper-card p-4 grid sm:grid-cols-3 gap-3">
          {f("symbol")}{f("theme")}{f("qty", "number")}{f("buyPrice", "number")}{f("ltp", "number")}{f("buyDate", "date")}
          <label className="text-xs flex flex-col gap-1">Conviction
            <select className="border px-2 py-1 text-sm bg-background" value={edit.conviction} onChange={(e) => setEdit({ ...edit, conviction: e.target.value as Holding["conviction"] })}>
              <option>High</option><option>Med</option><option>Low</option></select></label>
          {f("reason")}{f("preMortem")}
          <div className="sm:col-span-3 flex gap-2"><Button variant="ghost" onClick={save} className="bg-primary text-primary-foreground px-3 py-1 font-bold">Save</Button><Button variant="ghost" onClick={() => setEdit(null)} className="border px-3 py-1">Cancel</Button></div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b-2 border-foreground text-left"><th className="p-2">Stock</th><th>Weight</th><th>Sizing</th><th>P&L</th><th>Tax Check</th><th>Why / Pre-Mortem</th><th></th></tr></thead>
          <tbody>{holdings.map((h) => {
            const w = (h.qty * h.ltp * 100) / total; const v = sizingVerdict(w, h.conviction); const t = taxStatus(h.buyDate);
            const pnl = (h.ltp - h.buyPrice) * h.qty;
            return (
              <tr key={h.id} className="border-b align-top">
                <td className="p-2"><StockLink symbol={h.symbol} /><div className="text-xs text-muted-foreground">{h.theme} · {h.conviction}</div></td>
                <td className="p-2">{w.toFixed(1)}%</td>
                <td className={`p-2 font-bold ${v === "OK" ? "text-gain" : "text-loss"}`}>{v}<div className="text-xs font-normal text-muted-foreground">target {sizingRange[h.conviction].join("-")}%</div></td>
                <td className={`p-2 ${pnl >= 0 ? "text-gain" : "text-loss"}`}>₹{Math.round(pnl).toLocaleString("en-IN")}</td>
                <td className="p-2"><b>{t.type}</b> @{t.rate}%{t.type === "STCG" && <div className="text-xs text-warn">{t.daysToLtcg} days to LTCG</div>}</td>
                <td className="p-2 text-xs">{h.reason}<div className="text-loss">⚠ {h.preMortem}</div></td>
                <td className="p-2 whitespace-nowrap"><Button variant="ghost" className="underline" onClick={() => setEdit(h)}>Edit</Button> <Button variant="ghost" className="underline text-loss" onClick={() => setHoldings(holdings.filter((x) => x.id !== h.id))}>✕</Button></td>
              </tr>);
          })}</tbody>
        </table>
      </div>
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
    </section>
  );
}
