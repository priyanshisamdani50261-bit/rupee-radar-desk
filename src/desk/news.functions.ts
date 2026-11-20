import { createServerFn } from "@tanstack/react-start";
import { RSS_SOURCES, parseFeed } from "./rss";
export const refreshNews = createServerFn({ method: "GET" }).handler(async () => {
  const results = await Promise.all(RSS_SOURCES.map(async source => {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(12000), redirect: "follow", headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
      if (!response.ok) throw new Error("Feed unavailable");
      const xml = await response.text();
      if (xml.length > 2000000) throw new Error("Feed too large");
      const articles = parseFeed(xml, source.name);
      return { source: source.name, articles, error: articles.length ? null : `${source.name}: no articles returned.` };
    } catch { return { source: source.name, articles: [], error: `${source.name}: feed unavailable or blocked; try again later.` }; }
  }));
  const articles = results.flatMap(r => r.articles).filter((a, i, all) => all.findIndex(b => b.link === a.link) === i);
  return { articles, errors: results.flatMap(r => r.error ? [r.error] : []), refreshedAt: new Date().toISOString() };
});