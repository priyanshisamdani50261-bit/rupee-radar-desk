import { useEffect, useRef, useState } from "react";
import { preprocessSpeech, voiceRank } from "./pronunciation";
import type { Lang } from "./data";

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices().filter((v) => /hi|en-IN|en/i.test(v.lang)));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

export const getVoiceName = () => (typeof window === "undefined" ? "" : localStorage.getItem("mmd-voice") || "");

/**
 * Pick a voice that matches the language being read:
 *  - "hi" (शुद्ध हिंदी)      -> a Hindi (hi-*) voice
 *  - "hinglish" / "en"       -> an Indian-English (en-IN) voice, then any English voice
 *  - undefined (Voice Settings test) -> the saved voice, or the best-ranked Indian voice
 * The voice saved in Voice Settings is used only when it matches the language.
 */
function pickVoice(available: SpeechSynthesisVoice[], lang: Lang | undefined, saved: string) {
  const fits = (v: SpeechSynthesisVoice) => !lang || (lang === "hi" ? /^hi/i.test(v.lang) : /^en/i.test(v.lang));
  const savedVoice = available.find((x) => x.name === saved);
  if (savedVoice && fits(savedVoice)) return savedVoice;
  const pool = available.filter(fits);
  const ranked = [...pool].filter((x) => /hi|en-IN/i.test(x.lang)).sort((a, b) => voiceRank(b) - voiceRank(a));
  if (ranked[0]) return ranked[0];
  if (pool[0]) return pool[0];
  return lang === "hi" ? undefined : savedVoice ?? [...available].sort((a, b) => voiceRank(b) - voiceRank(a))[0];
}

/** Speaker that can pause/resume from the exact word & change speed mid-way. */
export function useSpeaker() {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRateS] = useState(1);
  const [error, setError] = useState("");
  const text = useRef(""); const pos = useRef(0); const base = useRef(0); const rateRef = useRef(1);
  const langRef = useRef<Lang | undefined>(undefined);
  const token = useRef(0);

  const speakFrom = (from: number) => {
    const s = window.speechSynthesis;
    if (!s) { setError("Audio is not supported in this browser."); return; }
    s.cancel();
    const my = ++token.current;
    base.current = from;
    const u = new SpeechSynthesisUtterance(text.current.slice(from));
    u.rate = rateRef.current;
    const v = pickVoice(s.getVoices(), langRef.current, getVoiceName());
    if (!v) {
      setError(langRef.current === "hi" ? "No Hindi voice is installed on this device. Install one, or switch to Hinglish / Pure English." : "No Indian voice is available. Choose an installed voice in Voice Settings.");
      setState("idle"); return;
    }
    u.voice = v; u.lang = v.lang; setError("");
    u.onboundary = (e) => { if (my === token.current) pos.current = base.current + e.charIndex; };
    u.onend = () => { if (my === token.current) { setState("idle"); pos.current = 0; } };
    s.speak(u); setState("playing");
  };
  const play = (t: string, lang?: Lang) => { langRef.current = lang; text.current = preprocessSpeech(t); pos.current = 0; speakFrom(0); };
  const pause = () => { token.current++; window.speechSynthesis.cancel(); setState("paused"); };
  const resume = () => speakFrom(pos.current);
  const stop = () => { token.current++; window.speechSynthesis.cancel(); pos.current = 0; setState("idle"); };
  const setRate = (r: number) => { rateRef.current = r; setRateS(r); if (state === "playing") speakFrom(pos.current); };
  useEffect(() => () => { if (state !== "idle") window.speechSynthesis?.cancel(); }, []); // eslint-disable-line
  return { state, rate, play, pause, resume, stop, setRate, error };
}
