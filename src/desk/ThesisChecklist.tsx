import { useState } from "react";
import { convictionScore } from "./stocks";
export type ThesisNote = { note: string; conviction: number; triggers: string[] };
export function ThesisChecklist() {
  const [value, setValue] = useState<ThesisNote>({ note: "", conviction: 50, triggers: [] });
  const triggers = ["Two consecutive quarters miss the core thesis", "Debt rises above my stated risk limit", "Management breaks a dated hard promise"];
  return <section className="border-y py-4 space-y-4">
    <h3 className="font-bold">What Would Make Me Sell</h3>
    {triggers.map(t => <label key={t} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 accent-foreground" checked={value.triggers.includes(t)} onChange={e => setValue({ ...value, triggers: e.target.checked ? [...value.triggers, t] : value.triggers.filter(v => v !== t) })} /><span>{t}<span className="block text-xs text-muted-foreground">{value.triggers.includes(t) ? "Active sell trigger" : "Monitoring"}</span></span></label>)}
    <label className="block font-bold">Watchlist Conviction Score <span className="float-right">{value.conviction}/100</span><input aria-label="Watchlist Conviction Score" type="range" min="0" max="100" value={value.conviction} onChange={e => setValue({ ...value, conviction: convictionScore(Number(e.target.value)) })} className="w-full accent-foreground mt-3" /></label>
    <label className="block text-sm font-bold">Research Notes<textarea aria-label="Research Notes" className="w-full border bg-background p-3 mt-2 min-h-28 font-normal" value={value.note} onChange={e => setValue({ ...value, note: e.target.value })} /></label>
    <p className="text-xs text-warn">Unsaved preview — private account saving is awaiting account setup.</p>
  </section>;
}