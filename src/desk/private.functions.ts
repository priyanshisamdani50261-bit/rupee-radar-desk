import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
const holding = z.object({ id: z.string(), kind: z.enum(["holding", "watchlist"]).default("holding"), symbol: z.string().min(1).max(32), theme: z.string().max(100), qty: z.number().nonnegative(), buyPrice: z.number().nonnegative(), ltp: z.number().nonnegative(), buyDate: z.string(), conviction: z.enum(["High", "Med", "Low"]), reason: z.string().max(10000), preMortem: z.string().max(10000) });
export const readPortfolio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("portfolios").select("holdings").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Your portfolio could not be loaded.");
  return { holdings: data ? z.array(holding).parse(data.holdings) : [] };
});
export const writePortfolio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ holdings: z.array(holding).max(500) })).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from("portfolios").upsert({ user_id: context.userId, holdings: data.holdings });
  if (error) throw new Error("Your portfolio could not be saved.");
  return { saved: true };
});
export const readNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ symbol: z.string().min(1).max(32) })).handler(async ({ context, data }) => {
  const { data: note, error } = await context.supabase.from("research_notes").select("note, conviction, triggers").eq("user_id", context.userId).eq("symbol", data.symbol).maybeSingle();
  if (error) throw new Error("Your notes could not be loaded.");
  return { note: note?.note ?? "", conviction: note?.conviction ?? 50, triggers: z.array(z.string()).catch([]).parse(note?.triggers ?? []) };
});
export const writeNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ symbol: z.string().min(1).max(32), note: z.string().max(20000), conviction: z.number().int().min(0).max(100), triggers: z.array(z.string().max(500)).max(50) })).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from("research_notes").upsert({ user_id: context.userId, ...data });
  if (error) throw new Error("Your notes could not be saved.");
  return { saved: true };
});