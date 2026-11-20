import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshNews } from "./news.functions";
import { mentionedStocks } from "./stocks";
import { StockLink } from "./StockLink";
import type { LiveArticle } from "./rss";
export function LiveNews({ onNews }: { onNews: (articles: LiveArticle[]) => void }) {
  const refresh = useServerFn(refreshNews);
  const [result, setResult] = useState<Awaited<ReturnType<typeof refreshNews>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true); setError("");
    try { const r = await refresh(); setResult(r); onNews(r.articles); } catch { setError("News refresh failed. Please try again."); } finally { setBusy(false); }
  }
  return <section className="space-y-3">
    <Button variant="outline" onClick={run} disabled={busy}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Refreshing news…" : "Refresh Live News"}</Button>
    {error && <p role="alert" className="text-loss text-sm">{error}</p>}
    {result && <><p className="text-xs text-muted-foreground">{result.articles.length} live headlines · Refreshed {new Date(result.refreshedAt).toLocaleTimeString("en-IN")} · Headlines are not independently verified.</p>{result.errors.map(e => <p role="status" className="text-warn text-xs" key={e}>{e}</p>)}
    {result.articles.map(a => <article key={a.link} className="paper-card p-3 space-y-2"><p className="text-xs text-muted-foreground">{a.source} · {a.published}</p><a href={a.link} target="_blank" rel="noopener noreferrer" className="font-bold underline">{a.title}</a><p className="text-sm">{a.summary}</p><div className="flex gap-3 flex-wrap">{mentionedStocks(a.title + " " + a.summary).map(s => <StockLink key={s.symbol} symbol={s.symbol} />)}</div></article>)}</>}
  </section>;
}