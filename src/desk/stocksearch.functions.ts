import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STOCKS } from "./stocks";

// Yahoo blocks requests without a browser-like User-Agent.
const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json",
};

type RawQuote = {
  symbol?: string; shortname?: string; longname?: string; quoteType?: string;
  sector?: string; sectorDisp?: string; industry?: string; industryDisp?: string;
};
type Hit = { yahooSymbol: string; symbol: string; name: string; exchange: "NSE" | "BSE"; sector: string };

/** Live auto-suggest: company name or symbol -> Indian (.NS / .BO) equities only. */
export const searchIndianStocks = createServerFn({ method: "POST" })
  .inputValidator(z.object({ q: z.string().trim().min(1).max(60) }))
  .handler(async ({ data }): Promise<{ hits: Hit[] }> => {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(data.q)}&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=true&lang=en-IN&region=IN`;
    const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("Stock search is unavailable right now.");
    const body = (await res.json()) as { quotes?: RawQuote[] };
    const indian = (body.quotes ?? [])
      .filter((q) => q.symbol && /\.(NS|BO)$/i.test(q.symbol) && (!q.quoteType || q.quoteType === "EQUITY"))
      // NSE listing first, keep Yahoo's relevance order inside each group
      .sort((a, b) => Number(b.symbol?.toUpperCase().endsWith(".NS")) - Number(a.symbol?.toUpperCase().endsWith(".NS")));
    const seen = new Set<string>();
    const hits: Hit[] = [];
    for (const q of indian) {
      if (!q.symbol) continue;
      const yahooSymbol = q.symbol.toUpperCase();
      const symbol = yahooSymbol.replace(/\.(NS|BO)$/, "");
      if (seen.has(symbol)) continue; // same company on NSE + BSE -> show once
      seen.add(symbol);
      // Prefer the app's own sector names (e.g. "Banking") so themes stay consistent with existing holdings.
      const sector = STOCKS.find((s) => s.symbol === symbol)?.sector ?? q.sectorDisp ?? q.sector ?? q.industryDisp ?? q.industry ?? "";
      hits.push({ yahooSymbol, symbol, name: q.longname ?? q.shortname ?? symbol, exchange: yahooSymbol.endsWith(".NS") ? "NSE" : "BSE", sector });
    }
    return { hits: hits.slice(0, 8) };
  });

/** Last traded price for one Yahoo symbol (e.g. THYROCARE.NS). */
export const lookupLtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({ symbol: z.string().regex(/^[A-Za-z0-9&.\-]{1,32}$/) }))
  .handler(async ({ data }): Promise<{ price: number | null }> => {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(data.symbol)}?interval=1d&range=1d`, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return { price: null };
      const body = (await res.json()) as { chart?: { result?: { meta?: { regularMarketPrice?: number } }[] } };
      const price = body.chart?.result?.[0]?.meta?.regularMarketPrice;
      return { price: typeof price === "number" && price > 0 ? price : null };
    } catch {
      return { price: null };
    }
  });
