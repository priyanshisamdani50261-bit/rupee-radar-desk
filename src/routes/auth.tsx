import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/desk/account";
export const Route = createFileRoute("/auth")({ head: () => ({ meta: [{ title: "Private Account | MY MARKET DESK" }, { name: "description", content: "Sign in to securely save your portfolio and stock research notes." }, { property: "og:title", content: "MY MARKET DESK — Private Account" }, { property: "og:description", content: "Your private portfolio and research notebook." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: AuthPage });
function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const { user } = useAccount(); const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      if (mode === "forgot") { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setMessage("If this address has an account, a password reset link will arrive by email."); }
      else if (mode === "signup") { const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }); if (error) throw error; if (data.session) await navigate({ to: "/" }); else setMessage("Check your email to confirm your account before signing in."); }
      else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; await navigate({ to: "/" }); }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Account request failed. Please try again."); } finally { setBusy(false); }
  }
  return <main className="max-w-md mx-auto px-5 py-10 space-y-5"><Link to="/" className="font-bold underline">← MY MARKET DESK</Link><h1 className="text-3xl font-bold">{user ? "You're signed in" : mode === "signup" ? "Create private account" : mode === "forgot" ? "Reset password" : "Sign in"}</h1>{user ? <Button asChild><Link to="/">Return to your desk</Link></Button> : <><form className="space-y-4" onSubmit={submit}><label className="block text-sm">Email<input aria-label="Email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border bg-background p-2 mt-1" /></label>{mode !== "forgot" && <label className="block text-sm">Password<input aria-label="Password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full border bg-background p-2 mt-1" /></label>}<Button disabled={busy} type="submit" className="w-full">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button></form><div className="flex flex-wrap gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>{mode === "signup" ? "Already have an account?" : "Create account"}</Button><Button variant="link" onClick={() => { setMode(mode === "forgot" ? "login" : "forgot"); setMessage(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div></>}{message && <p role="status" className="text-sm border-t pt-4">{message}</p>}</main>;
}