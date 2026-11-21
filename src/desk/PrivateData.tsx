import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "./account";
import { readPortfolio, writePortfolio, readNote, writeNote } from "./private.functions";
import type { Holding } from "./data";
export function AccountButton() {
  const { user, ready } = useAccount(); const cache = useQueryClient(); const navigate = useNavigate();
  async function signOut() { await cache.cancelQueries(); cache.clear(); const { error } = await supabase.auth.signOut(); if (!error) await navigate({ to: "/auth", replace: true }); }
  return user ? <Button size="sm" variant="outline" onClick={signOut}>Sign out</Button> : <Button size="sm" variant="outline" asChild disabled={!ready}><Link to="/auth">Sign in</Link></Button>;
}
export function usePrivatePortfolio() {
  const { user } = useAccount(); const cache = useQueryClient(); const read = useServerFn(readPortfolio); const write = useServerFn(writePortfolio);
  const key = ["portfolio", user?.id];
  const query = useQuery({ queryKey: key, queryFn: () => read(), enabled: Boolean(user) });
  const mutation = useMutation({ mutationFn: (holdings: Holding[]) => write({ data: { holdings } }), onSuccess: (_, holdings) => cache.setQueryData(key, { holdings }) });
  return { holdings: query.data?.holdings ?? [], setHoldings: (h: Holding[]) => mutation.mutate(h), loading: Boolean(user) && query.isPending, saving: mutation.isPending, error: query.error || mutation.error };
}
export function usePrivateNote(symbol: string) {
  const { user } = useAccount(); const cache = useQueryClient(); const read = useServerFn(readNote); const write = useServerFn(writeNote);
  const key = ["research-note", user?.id, symbol];
  const query = useQuery({ queryKey: key, queryFn: () => read({ data: { symbol } }), enabled: Boolean(user) });
  const mutation = useMutation({ mutationFn: (note: { note: string; conviction: number; triggers: string[] }) => write({ data: { symbol, ...note } }), onSuccess: (_, value) => cache.setQueryData(key, value) });
  return { query, mutation };
}