import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAccount } from "./account";
import { usePrivateNote } from "./PrivateData";
import { convictionScore } from "./stocks";
export type ThesisNote = { note: string; conviction: number; triggers: string[] };
export function ThesisChecklist({ symbol }: { symbol: string }) {
  const { user } = useAccount();
  const { query, mutation } = usePrivateNote(symbol);
  const [value, setValue] = useState<ThesisNote>({ note: "", conviction: 50, triggers: [] });
  const [editing, setEditing] = useState(false);
  useEffect(() => { setValue(query.data ?? { note: "", conviction: 50, triggers: [] }); }, [query.data, user?.id, symbol]);
  const triggers = ["Two consecutive quarters miss the core thesis", "Debt rises above my stated risk limit", "Management breaks a dated hard promise"];
  return <section className="border-y py-4 space-y-4">
    <div className="flex justify-between gap-3 flex-wrap"><h3 className="font-bold">What Would Make Me Sell</h3><Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>+ Add Evidence / Edit Thesis</Button></div>
    {editing && <label className="block text-sm">Thesis, supporting evidence and disconfirming evidence<textarea aria-label="Edit Thesis" className="w-full border bg-background p-3 min-h-28" value={value.note} onChange={e => setValue({ ...value, note: e.target.value })} /></label>}
    {triggers.map(t => <label key={t} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 accent-foreground" checked={value.triggers.includes(t)} onChange={e => setValue({ ...value, triggers: e.target.checked ? [...value.triggers, t] : value.triggers.filter(v => v !== t) })} /><span>{t}<span className="block text-xs text-muted-foreground">{value.triggers.includes(t) ? "Active sell trigger" : "Monitoring"}</span></span></label>)}
    <label className="block font-bold">Watchlist Conviction Score <span className="float-right">{value.conviction}/100</span><input aria-label="Watchlist Conviction Score" type="range" min="0" max="100" value={value.conviction} onChange={e => setValue({ ...value, conviction: convictionScore(Number(e.target.value)) })} className="w-full accent-foreground mt-3" /></label>
    <label className="block text-sm font-bold">Research Notes<textarea aria-label="Research Notes" className="w-full border bg-background p-3 mt-2 min-h-28 font-normal" value={value.note} onChange={e => setValue({ ...value, note: e.target.value })} /></label>
    {user ? <><Button onClick={() => mutation.mutate(value)} disabled={mutation.isPending || query.isPending}>{mutation.isPending ? "Saving…" : "Save Private Notes"}</Button>{mutation.isSuccess && <p role="status" className="text-gain text-sm">Private notes saved.</p>}{(query.error || mutation.error) && <p role="alert" className="text-loss text-sm">Your notes could not be loaded or saved. Try again.</p>}</> : <Button asChild variant="outline"><Link to="/auth">Sign in to save private notes</Link></Button>}
  </section>;
}