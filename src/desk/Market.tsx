import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getQuotes } from "./market.functions";
import { isMarketOpen } from "./news-model";
import type { Quote } from "./market-model";
export function useMarket() {
  const get = useServerFn(getQuotes); const [active,setActive] = useState(false);
  useEffect(() => { const sync = () => setActive(document.visibilityState === "visible" && isMarketOpen()); sync(); const timer = setInterval(sync,1000); document.addEventListener("visibilitychange",sync); return () => {clearInterval(timer);document.removeEventListener("visibilitychange",sync);}; },[]);
  return useQuery({queryKey:["market-quotes"],queryFn:() => get(),refetchInterval:active ? 15000 : false,refetchIntervalInBackground:false,refetchOnWindowFocus:active,staleTime:15000});
}
export function MarketTicker({ quotes }: {quotes:Quote[]}) {
  const row = [...quotes.filter(q => ["NIFTY 50","SENSEX","BANK NIFTY","INDIA VIX","DOW JONES"].includes(q.name)),...quotes.filter(q => ["NIFTY 50","SENSEX","BANK NIFTY","INDIA VIX","DOW JONES"].includes(q.name))];
  return <div className="overflow-hidden border-y border-foreground bg-secondary text-sm"><div className="flex w-max animate-ticker gap-8 py-2 px-4">{row.length ? row.map((q,i) => <span key={`${q.name}-${i}-${q.time}`} className={`whitespace-nowrap quote-flash ${q.chg >= 0 ? "text-gain" : "text-loss"}`}><b className="text-foreground">{q.name}</b> {q.value.toLocaleString("en-IN",{maximumFractionDigits:2})} {q.chg >= 0 ? "▲" : "▼"} {q.chg.toFixed(2)}%</span>) : <span>Live index prices unavailable — no simulated quotes.</span>}</div></div>;
}
export function LiveHeatmap({quotes,onSector}:{quotes:Quote[];onSector:(s:string)=>void}) {
  const sectors = ["Bank","IT","Auto","Pharma","FMCG","Metal","Realty","Energy","Infra"];
  return <div className="grid grid-cols-3 gap-1">{sectors.map(s => {const q=quotes.find(q => q.name===s);return <Button key={s} variant="ghost" onClick={()=>onSector(s==="Bank" ? "Banking" : s)} className={`h-14 whitespace-normal text-xs rounded-none ${q ? q.chg>=0 ? "bg-gain text-primary-foreground" : "bg-loss text-primary-foreground" : "bg-muted"}`}>{s}<br/>{q ? `${q.chg>0 ? "+" : ""}${q.chg.toFixed(2)}%` : "—"}</Button>;})}</div>;
}