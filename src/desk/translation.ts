import { useEffect, useState, useSyncExternalStore } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAccount } from "./account";
import { translateArticles } from "./translate.functions";
import type { Lang } from "./data";
import type { ArchivedArticle } from "./news-model";

export type Tr = { headline: string; tldr: string[] };

// Two cache layers: in-memory (instant language switching) + localStorage (survives reloads).
const LS_PREFIX = "mmd-tr-v1:";
const mem = new Map<string, Tr>();
const inflight = new Set<string>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
const keyOf = (id: string, lang: Lang) => `${id}:${lang}`;
const emit = () => { version++; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

function cached(key: string): Tr | undefined {
  return mem.get(key);
}
function hydrate(key: string): Tr | undefined {
  const hit = mem.get(key);
  if (hit) return hit;
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as Partial<Tr>;
    if (typeof v.headline === "string" && Array.isArray(v.tldr) && v.tldr.length === 3) {
      const t = { headline: v.headline, tldr: v.tldr.map(String) };
      mem.set(key, t);
      return t;
    }
  } catch { /* corrupt cache entry: ignore and re-translate */ }
  return undefined;
}
function store(key: string, t: Tr) {
  mem.set(key, t);
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(t)); } catch { /* storage full or blocked */ }
}

/** Best available text for a story in a language: saved enrichment first, then cached Gemini translation. */
export function translatedFor(a: ArchivedArticle, lang: Lang): Tr | undefined {
  return a.enrichment?.[lang] ?? cached(keyOf(a.id, lang));
}
export const isTranslating = (id: string, lang: Lang) => inflight.has(keyOf(id, lang));
/** Re-render the calling component whenever any translation arrives. */
export const useTranslationTick = () => useSyncExternalStore(subscribe, () => version, () => 0);

/** Translates every story in `articles` that has no text yet in `lang`, in batches, via Gemini. */
export function useTranslations(articles: ArchivedArticle[], lang: Lang) {
  const { user } = useAccount();
  const translate = useServerFn(translateArticles);
  useTranslationTick();
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  function retry() {
    articles.forEach(a => failed.delete(keyOf(a.id,lang)));
    setError("");
    setAttempt(v => v + 1);
  }

  const missing = articles.filter((a) => !translatedFor(a, lang));
  const signature = missing.map((a) => a.id).join(",");

  useEffect(() => {
    let loaded = false;
    articles.forEach(a => { const key = keyOf(a.id,lang); if (!mem.has(key) && hydrate(key)) loaded = true; });
    if (loaded) emit();
  }, [signature,lang]); // public publisher text only; hydrate after render to avoid SSR mismatches

  useEffect(() => {
    if (!user) return;
    const todo = articles.filter((a) => !translatedFor(a,lang) && !inflight.has(keyOf(a.id, lang)) && !failed.has(keyOf(a.id,lang))).slice(0, 40);
    if (!todo.length) return;
    todo.forEach((a) => inflight.add(keyOf(a.id, lang)));
    emit();
    setTranslating(true); setError("");
    (async () => {
      try {
        for (let i = 0; i < todo.length; i += 10) {
          const chunk = todo.slice(i, i + 10);
          const { results } = await translate({ data: { lang, items: chunk.map((a) => ({ title: a.title.slice(0, 500), summary: a.summary.slice(0, 1200) })) } });
          chunk.forEach((a, j) => { const t = results[j]; if (t) store(keyOf(a.id, lang), t); });
          emit();
        }
      } catch (e) {
        todo.forEach(a => failed.add(keyOf(a.id,lang)));
        setError(e instanceof Error && !/timeout|abort/i.test(e.message) ? e.message : "Google Gemini took too long to respond. Try again shortly; original headlines are shown.");
      } finally {
        todo.forEach((a) => inflight.delete(keyOf(a.id, lang)));
        setTranslating(false);
        emit();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, lang, user?.id, attempt]);

  return { translating, error, pending: missing.length, retry };
}
