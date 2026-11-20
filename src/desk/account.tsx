import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
export const AccountContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export function useAccount() { return useContext(AccountContext); }
export function AccountProvider({ user, ready, children }: { user: User | null; ready: boolean; children: ReactNode }) { return <AccountContext.Provider value={{ user, ready }}>{children}</AccountContext.Provider>; }