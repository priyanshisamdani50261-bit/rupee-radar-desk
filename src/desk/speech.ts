import { useEffect, useRef, useState } from "react";

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

/** Speaker that can pause/resume from the exact word & change speed mid-way. */
export function useSpeaker() {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRateS] = useState(1);
  const text = useRef(""); const pos = useRef(0); const base = useRef(0); const rateRef = useRef(1);
  const token = useRef(0);

  const speakFrom = (from: number) => {
    const s = window.speechSynthesis; s.cancel();
    const my = ++token.current;
    base.current = from;
    const u = new SpeechSynthesisUtterance(text.current.slice(from));
    u.rate = rateRef.current;
    const vn = getVoiceName(); const v = s.getVoices().find((x) => x.name === vn);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-IN";
    u.onboundary = (e) => { if (my === token.current) pos.current = base.current + e.charIndex; };
    u.onend = () => { if (my === token.current) { setState("idle"); pos.current = 0; } };
    s.speak(u); setState("playing");
  };
  const play = (t: string) => { text.current = t; pos.current = 0; speakFrom(0); };
  const pause = () => { token.current++; window.speechSynthesis.cancel(); setState("paused"); };
  const resume = () => speakFrom(pos.current);
  const stop = () => { token.current++; window.speechSynthesis.cancel(); pos.current = 0; setState("idle"); };
  const setRate = (r: number) => { rateRef.current = r; setRateS(r); if (state === "playing") speakFrom(pos.current); };
  useEffect(() => () => { if (state !== "idle") window.speechSynthesis?.cancel(); }, []); // eslint-disable-line
  return { state, rate, play, pause, resume, stop, setRate };
}
