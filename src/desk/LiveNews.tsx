import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { archiveNews, refreshNews } from "./news.functions";
import { istDate, SECTOR_OPTIONS, SOURCE_OPTIONS, sourceMatches, type ArchivedArticle } from "./news-model";
import { useAccount } from "./account";
import { FeedCard } from "./FeedCard";
import { useTranslations } from "./translation";
import type { Holding, Lang } from "./data";
import type { LiveArticle } from "./rss";
export function LiveNews({ onNews, lang = "en", holdings = [], sector = "All Sectors", setSector, signalsOnly = false, filingsOnly = false, hideNoise = false, industries = {}, onArticles, node }: { onNews?: (articles: LiveArticle[]) => void; lang?: Lang; holdings?: Holding[]; sector?: string; setSector?: (s:string) => void; signalsOnly?: boolean; filingsOnly?: boolean; hideNoise?: boolean; industries?: Record<string,boolean>; onArticles?: (articles: ArchivedArticle[]) => void; node?: string }) {
  const refresh = useServerFn(refreshNews); const read = useServerFn(archiveNews); const cache = useQueryClient(); const { user } = useAccount();
  const [date,setDate] = useState(""); const [sources,setSources] = useState(SOURCE_OPTIONS.slice(1)); const [open,setOpen] = useState(false);
  const [busy,setBusy] = useState(false); const [errors,setErrors] = useState<string[]>([]);
  useEffect(() => { setDate(istDate()); },[]);
  const query = useQuery({ queryKey:["news-archive",date], queryFn:() => read({ data:{ date } }), enabled:Boolean(date) });
  useEffect(() => { if (query.data) onArticles?.(query.data.articles); },[query.data,onArticles]);
  async function run() { setBusy(true); setErrors([]); try { const r = await refresh(); setErrors(r.errors); onNews?.(r.articles); await cache.invalidateQueries({ queryKey:["news-archive"] }); } catch(e) { setErrors([e instanceof Error ? e.message : "News refresh failed."]); } finally { setBusy(false); } }
  const articles = (query.data?.articles ?? []).filter(a => sources.some(source=>sourceMatches(a.source,source)) && (!filingsOnly || /BSE|NSE|SEBI|RBI/.test(a.source)) && (!signalsOnly || a.enrichment?.tag === "Signal") && (!hideNoise || a.enrichment?.tag !== "Noise") && (sector === "All Sectors" || a.enrichment?.sectors.some(s => s.name === sector) || (a.title+" "+a.summary).toLowerCase().includes(sector.toLowerCase())) && !a.enrichment?.sectors.some(s => industries[s.name] === false) && (!node || (a.title+" "+a.summary+JSON.stringify(a.enrichment)).toLowerCase().includes(node.toLowerCase())));
  // Translate every visible story that has no text in the selected language yet (Gemini 2.5 Flash, cached).
  const tx = useTranslations(articles, lang);
  return <section className="space-y-3">
    <div className="flex flex-wrap gap-2 items-center"><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" size="sm"><CalendarIcon />Date {date}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" className="pointer-events-auto" selected={date ? new Date(`${date}T12:00:00`) : undefined} disabled={{ after:new Date() }} onSelect={d => { if(d) { setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); setOpen(false); } }} /></PopoverContent></Popover>
    {setSector && <select aria-label="Sector Filter" className="border bg-background px-2 py-2 text-xs max-w-full" value={sector} onChange={e => setSector(e.target.value)}>{SECTOR_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>}
    <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" aria-label="News Source Filter">{sources.length === SOURCE_OPTIONS.length-1 ? "All Verified Sources" : `${sources.length} Sources`}</Button></PopoverTrigger><PopoverContent className="w-72 max-h-96 overflow-auto" align="start"><div className="flex justify-between border-b pb-2 mb-2"><Button size="sm" variant="link" onClick={()=>setSources(SOURCE_OPTIONS.slice(1))}>Select All</Button><Button size="sm" variant="link" onClick={()=>setSources([])}>Clear</Button></div>{SOURCE_OPTIONS.slice(1).map(s=><label key={s} className="flex items-start gap-2 py-2 text-sm"><input type="checkbox" checked={sources.includes(s)} onChange={e=>setSources(e.target.checked ? [...sources,s] : sources.filter(v=>v!==s))} className="mt-1 accent-foreground"/>{s}</label>)}</PopoverContent></Popover>
    {user ? <Button variant="outline" size="sm" onClick={run} disabled={busy}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Refreshing news…" : "Refresh Live News"}</Button> : <Button variant="outline" size="sm" asChild><Link to="/auth">Sign in to refresh live news</Link></Button>}</div>
    {errors.length > 0 && <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Refresh details" title="Refresh details"><Info/></Button></PopoverTrigger><PopoverContent className="w-80 max-h-80 overflow-auto text-xs"><b>Refresh details</b>{errors.map(e=><p key={e} className="mt-2">{e}</p>)}</PopoverContent></Popover>}
    {query.error && <p role="alert" className="text-loss text-sm">News archive could not be loaded.</p>}
    {query.isFetching && <p className="text-xs text-muted-foreground">Loading saved headlines…</p>}
    {tx.translating && <p role="status" className="text-xs text-muted-foreground">Translating visible stories with Gemini…</p>}
    {tx.error && <p role="alert" className="text-xs text-loss">{tx.error}</p>}
    {!query.isFetching && !articles.length && <p className="text-sm text-muted-foreground py-6 border-y">No saved stories match this date and these filters.</p>}
    {articles.map(a => <FeedCard key={a.id} article={a} lang={lang} holdings={holdings} />)}
  </section>;
}
