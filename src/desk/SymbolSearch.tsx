import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchIndianStocks } from "./stocksearch.functions";
import { Button } from "@/components/ui/button";

export type StockHit = { yahooSymbol: string; symbol: string; name: string; exchange: "NSE" | "BSE"; sector: string };

/** Symbol input with a live NSE/BSE auto-suggest dropdown. Typing free text still works. */
export function SymbolSearch({ value, onChange, onPick }: { value: string; onChange: (text: string) => void; onPick: (hit: StockHit) => void }) {
  const search = useServerFn(searchIndianStocks);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<StockHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const req = useRef(0);
  const query = value.trim();

  // Debounced search; only runs while the user is typing (open === true).
  useEffect(() => {
    if (!open || query.length < 2) { setHits([]); setBusy(false); return; }
    const id = ++req.current;
    const timer = setTimeout(async () => {
      setBusy(true); setErr("");
      try {
        const r = await search({ data: { q: query } });
        if (id === req.current) { setHits(r.hits); setActive(r.hits.length ? 0 : -1); }
      } catch {
        if (id === req.current) { setHits([]); setErr("Suggestions unavailable. You can still type the symbol yourself."); }
      } finally {
        if (id === req.current) setBusy(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const choose = (h: StockHit) => { req.current++; setOpen(false); setHits([]); setBusy(false); onPick(h); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open || !hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + hits.length) % hits.length); }
    else if (e.key === "Enter" && active >= 0) { const hit = hits[active]; if (hit) { e.preventDefault(); choose(hit); } }
  };

  const showPanel = open && query.length >= 2;
  return (
    <div ref={box} className="relative">
      <label className="text-xs flex flex-col gap-1">Symbol — type a company name
        <input
          role="combobox" aria-expanded={showPanel} aria-autocomplete="list" aria-controls="symbol-suggestions" autoComplete="off"
          placeholder="e.g. Thyrocare, Tata, HDFC"
          className="border px-2 py-1 text-sm bg-background" value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          onKeyDown={onKey}
        />
      </label>
      {showPanel && (
        <ul id="symbol-suggestions" role="listbox" className="paper-card absolute left-0 top-full z-30 mt-1 w-[min(28rem,calc(100vw-3rem))] max-h-72 overflow-auto bg-background">
          {busy && <li className="px-3 py-2 text-xs text-muted-foreground">Searching NSE / BSE…</li>}
          {!busy && err && <li role="alert" className="px-3 py-2 text-xs text-loss">{err}</li>}
          {!busy && !err && !hits.length && <li className="px-3 py-2 text-xs text-muted-foreground">No NSE / BSE stock found. The typed symbol will be used as-is.</li>}
          {hits.map((h, i) => (
            <li key={h.yahooSymbol} role="option" aria-selected={i === active}>
              <Button variant="ghost"
                type="button"
                // onMouseDown (not onClick) so the pick lands before the input loses focus
                onMouseDown={(e) => { e.preventDefault(); choose(h); }}
                onMouseEnter={() => setActive(i)}
                className={`w-full h-auto whitespace-normal text-left justify-start block px-3 py-2 border-b text-sm ${i === active ? "bg-accent" : ""}`}
              >
                <b>{h.name}</b>
                <span className="block text-xs text-muted-foreground">{h.symbol} · {h.exchange}{h.sector ? ` · ${h.sector}` : ""}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
