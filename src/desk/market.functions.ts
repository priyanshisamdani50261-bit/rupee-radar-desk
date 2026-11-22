import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { INDEX_SYMBOLS, type Quote, type QuoteResult } from "./market-model";
import { isMarketOpen } from "./news-model";
type Chart = { chart?: { result?: { meta: { regularMarketPrice?:number; chartPreviousClose?:number; previousClose?:number; regularMarketTime?:number }; timestamp?:number[]; indicators?:{ quote?: {close:(number|null)[]}[] } }[] } };
export const getQuotes = createServerFn({ method:"GET" }).handler(async (): Promise<QuoteResult> => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']; const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error("Quote storage unavailable.");
  const { publicClient } = await import("./public-client.server"); const client = publicClient(url,key);
  const {data: cached} = await client.from("market_cache").select("payload,fetched_at").eq("id","indices").maybeSingle();
  const existing = cached?.payload as QuoteResult | undefined;
  const age = cached ? Date.now()-Date.parse(cached.fetched_at) : Infinity;
  if(existing && age < (isMarketOpen() ? 15000 : 6*3600000)) return existing;
  const results = await Promise.all([...new Set(INDEX_SYMBOLS.map(s => s.symbol))].map(async symbol => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,{ headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(10000) });
      if(!r.ok) throw new Error("Quotes unavailable");
      const body = await r.json() as Chart; const meta = body.chart?.result?.[0]?.meta;
      if(typeof meta?.regularMarketPrice !== "number") throw new Error("Missing quote");
      const closes = body.chart?.result?.[0]?.indicators?.quote?.[0]?.close.filter((v):v is number=>typeof v==="number") ?? [];
      const previous = meta.previousClose ?? closes.at(-2) ?? meta.chartPreviousClose ?? meta.regularMarketPrice;
      return { symbol,value:meta.regularMarketPrice,chg:previous ? (meta.regularMarketPrice/previous-1)*100 : 0,time:new Date((meta.regularMarketTime ?? Date.now()/1000)*1000).toISOString() };
    } catch { return { symbol,error:`Yahoo: ${symbol} quote unavailable; last saved price retained.` }; }
  }));
  const quotes: Quote[] = INDEX_SYMBOLS.flatMap(s => { const r = results.find(r => r.symbol === s.symbol); if(r && "value" in r && typeof r.value === "number" && typeof r.chg === "number" && r.time) return [{name:s.name,symbol:s.symbol,value:r.value,chg:r.chg,time:r.time}]; const old = existing?.quotes.find(q => q.name === s.name); return old ? [old] : []; });
  const payload: QuoteResult = {quotes,errors:results.flatMap(r => "error" in r && r.error ? [r.error] : []),fetchedAt:new Date().toISOString()};
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("market_cache").upsert({id:"indices",payload:JSON.parse(JSON.stringify(payload)),fetched_at:payload.fetchedAt});
  return payload;
});
export const historicalReturns = createServerFn({method:"GET"}).inputValidator(z.object({symbol:z.string().regex(/^[A-Za-z0-9^&.\-]{1,32}$/),sector:z.string(),period:z.enum(["6M","12M","buy"]),buyDate:z.string().optional()})).handler(async({data}) => {
  const end = new Date(); const start = data.period === "buy" && data.buyDate ? new Date(data.buyDate) : new Date(end);
  if(data.period !== "buy") start.setMonth(start.getMonth()-(data.period === "6M" ? 6 : 12));
  if(!Number.isFinite(start.getTime()) || start >= end) throw new Error("Choose a valid past buy date.");
  const stock = data.symbol.includes("^") || data.symbol.endsWith(".NS") ? data.symbol : `${data.symbol}.NS`;
  const sector = INDEX_SYMBOLS.find(s => s.name.toLowerCase() === data.sector.toLowerCase())?.symbol ?? "^NSEI";
  const rows = await Promise.all([{label:"Stock",symbol:stock},{label:"NIFTY 50",symbol:"^NSEI"},{label:sector === "^NSEI" ? "Sector (unmapped)" : "Sector",symbol:sector}].map(async x => {
    try { const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(x.symbol)}?period1=${Math.floor(start.getTime()/1000)}&period2=${Math.floor(end.getTime()/1000)}&interval=1d`,{ headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(10000) }); if(!r.ok) throw new Error("Unavailable"); const b = await r.json() as Chart; const result = b.chart?.result?.[0]; const closes = result?.indicators?.quote?.[0]?.close.filter((v):v is number => typeof v === "number") ?? []; const first = closes[0]; const last = closes.at(-1); if(!first || !last || closes.length < 2) throw new Error("Missing history"); return { ...x,value:(last/first-1)*100,error:null }; } catch { return {...x,value:null,error:`Yahoo history unavailable for ${x.symbol}.`}; }
  }));
  return {rows,start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
});