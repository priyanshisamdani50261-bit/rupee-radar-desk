import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RSS_SOURCES, parseFeed } from "./rss";
import { enrichmentSchema, prohibitedRumour } from "./news-model";
export const archiveNews = createServerFn({ method: "GET" }).inputValidator(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).handler(async ({ data }) => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']; const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error("News archive unavailable.");
  const client = createClient(url,key,{ auth: { persistSession:false, autoRefreshToken:false }, global: { fetch: (input,init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey",key); return fetch(input,{ ...init,headers:h }); } } });
  const start = new Date(`${data.date}T00:00:00+05:30`); const end = new Date(start.getTime()+86400000);
  const { data: rows, error } = await client.from("news_archive").select("id,title,summary,source,link,published_at,enrichment").gte("published_at",start.toISOString()).lt("published_at",end.toISOString()).order("published_at",{ ascending:false }).limit(500);
  if (error) throw new Error("News archive could not be loaded.");
  return { articles: (rows ?? []).map(r => ({ ...r, enrichment: enrichmentSchema.safeParse(r.enrichment).success ? enrichmentSchema.parse(r.enrichment) : null })) };
});
export const refreshNews = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: recent } = await supabaseAdmin.from("news_archive").select("fetched_at").order("fetched_at",{ ascending:false }).limit(1).maybeSingle();
  if (recent && Date.now() - new Date(recent.fetched_at).getTime() < 60000) return { articles: [], errors: ["News was refreshed recently. Please wait a minute before another refresh."], refreshedAt:new Date().toISOString() };
  const results = await Promise.all(RSS_SOURCES.map(async source => {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(12000), redirect: "follow", headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
      if (!response.ok) throw new Error("Feed unavailable");
      const xml = await response.text(); if (xml.length > 2000000) throw new Error("Feed too large");
      const articles = parseFeed(xml, source.name).filter(a => !prohibitedRumour(a.title + " " + a.summary));
      return { articles, error: articles.length ? null : `${source.name}: no valid articles returned.` };
    } catch { return { articles: [], error: `${source.name}: official feed unavailable or blocked.` }; }
  }));
  const articles = results.flatMap(r => r.articles).filter((a, i, all) => all.findIndex(b => b.link === a.link) === i);
  const errors = results.flatMap(r => r.error ? [r.error] : []);
  const rows = articles.map(a => ({ link:a.link,title:a.title,summary:a.summary,source:a.source,published_at:Number.isFinite(Date.parse(a.published)) ? new Date(a.published).toISOString() : new Date().toISOString() }));
  const { error } = await supabaseAdmin.from("news_archive").upsert(rows,{ onConflict:"link",ignoreDuplicates:true });
  if (error) throw new Error("Headlines could not be archived. Please try again.");
  const { data: pending } = await supabaseAdmin.from("news_archive").select("id,title,summary,source,link,published_at").is("enrichment",null).order("published_at",{ ascending:false }).limit(12);
  const key = process.env['GEMINI_API_KEY'];
  if (!key) errors.push("Gemini key missing. Original headlines have been saved.");
  else if (pending?.length) { try {
    const { enrichArticles } = await import("./gemini.server");
    const enriched = await enrichArticles(pending.map(r => ({ title:r.title,summary:r.summary,source:r.source,link:r.link,published:r.published_at })),key);
    await Promise.all(pending.map((r,i) => enriched[i] ? supabaseAdmin.from("news_archive").update({ enrichment: enriched[i] }).eq("id",r.id) : Promise.resolve()));
  } catch (e) { errors.push(e instanceof Error ? e.message : "Gemini enrichment failed; original headlines saved."); } }
  return { articles, errors, refreshedAt:new Date().toISOString() };
});