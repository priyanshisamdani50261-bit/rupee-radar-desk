export type Lang = "hinglish" | "hi" | "en";
type T3 = Record<Lang, string>;

export const UI: Record<string, T3> = {
  brief: { hinglish: "🎧 5-Min Morning Audio Brief", hi: "🎧 5 मिनट सुबह का ऑडियो सार", en: "🎧 5-Min Morning Audio Brief" },
  voice: { hinglish: "🎙️ Voice Settings", hi: "🎙️ आवाज़ सेटिंग", en: "🎙️ Voice Settings" },
  changed: { hinglish: "Aaj Kya Badla?", hi: "आज क्या बदला?", en: "What Changed Today?" },
  noise: { hinglish: "Market Noise Meter", hi: "बाज़ार शोर मीटर", en: "Market Noise Meter" },
  listen: { hinglish: "🔊 Suno", hi: "🔊 सुनें", en: "🔊 Listen" },
  deep: { hinglish: "Deep Dive ▼", hi: "गहराई से ▼", en: "Deep Dive ▼" },
  command: { hinglish: "Command Center", hi: "कमांड सेंटर", en: "Command Center" },
  portfolio: { hinglish: "My Portfolio", hi: "मेरा पोर्टफोलियो", en: "My Portfolio" },
  themes: { hinglish: "Theme Exposure", hi: "थीम एक्सपोज़र", en: "Theme Exposure" },
  calendar: { hinglish: "Dual Event Calendar", hi: "दोहरा इवेंट कैलेंडर", en: "Dual Event Calendar" },
  smart: { hinglish: "Smart Money & Heatmaps", hi: "स्मार्ट मनी व हीटमैप", en: "Smart Money & Heatmaps" },
  prefs: { hinglish: "Feed Preferences", hi: "फ़ीड पसंद", en: "Feed Preferences" },
};
export const tr = (k: string, l: Lang) => UI[k]?.[l] ?? k;

export const TICKERS = [
  { name: "NIFTY 50", value: 24318.4, chg: 0.62 },
  { name: "SENSEX", value: 80142.7, chg: 0.55 },
  { name: "BANK NIFTY", value: 52410.15, chg: -0.21 },
  { name: "INDIA VIX", value: 14.82, chg: 3.4 },
  { name: "DOW JONES", value: 43210.9, chg: 0.18 },
];

export const GLOSSARY: Record<string, string> = {
  "P/E": "Price-to-Earnings: share price ÷ earnings per share. Batata hai aap ₹1 kamai ke liye kitna de rahe ho.",
  "repo rate": "The rate at which RBI lends to banks. Higher repo = costlier loans.",
  "NIM": "Net Interest Margin: bank's interest earned minus interest paid, as % of assets.",
  "FII": "Foreign Institutional Investors – overseas funds buying/selling Indian stocks.",
  "EBITDA": "Earnings before interest, tax, depreciation & amortisation – core operating profit.",
  "order book": "Total value of confirmed orders a company has yet to execute.",
  "QIP": "Qualified Institutional Placement – a way for listed companies to raise money from big institutions.",
};

export type News = {
  id: string; headline: T3; tldr: Record<Lang, string[]>; time: string; source: string;
  quality: number; verification: "Verified" | "Source Conflict" | "Pending";
  tag: "Signal" | "Watch" | "Noise"; relevance: number; pe: number; pe5y: number; filing: boolean;
  impact: string; winners: string[]; losers: string[]; bull: string; bear: string; thesis: string;
  pattern: string; timeline: { d: string; e: string }[]; sentiment: "Bull" | "Bear";
};

export const NEWS: News[] = [
  {
    id: "n1", time: "09:12 AM", source: "NSE Filing", quality: 5, verification: "Verified", tag: "Signal", relevance: 88, pe: 19.4, pe5y: 22.1, filing: true, sentiment: "Bull",
    headline: { en: "HDFC Bank Q2 NIM improves to 3.6%, deposits grow 15%", hinglish: "HDFC Bank ka Q2 NIM 3.6% tak sudhra, deposits 15% badhe", hi: "एचडीएफसी बैंक का दूसरी तिमाही NIM 3.6% हुआ, जमा 15% बढ़ी" },
    tldr: {
      en: ["NIM up 10 bps quarter-on-quarter", "Deposit growth outpaces loans, easing liquidity worry", "Asset quality stable; P/E below 5Y median"],
      hinglish: ["NIM 10 bps upar gaya pichhle quarter se", "Deposits loans se tez badhe, liquidity tension kam", "Asset quality stable; P/E 5 saal ke median se neeche"],
      hi: ["NIM पिछली तिमाही से 10 bps बढ़ा", "जमा ऋण से तेज़ बढ़ी, तरलता की चिंता कम", "परिसंपत्ति गुणवत्ता स्थिर; P/E पाँच वर्ष के माध्य से नीचे"],
    },
    impact: "Positive for private banks; re-rating possible.", winners: ["HDFCBANK", "ICICIBANK"], losers: ["Small finance banks"],
    bull: "Margin recovery + cheap valuation = re-rating.", bear: "Repo rate cuts could compress NIM again.", thesis: "Banking Re-rating",
    pattern: "Last 3 times NIM rose with P/E below median, stock gained avg 11% in 3 months.",
    timeline: [{ d: "Jul", e: "Merger drag on NIM" }, { d: "Sep", e: "Deposit drive launched" }, { d: "Today", e: "Q2 NIM improves" }],
  },
  {
    id: "n2", time: "08:40 AM", source: "Economic Times", quality: 3, verification: "Source Conflict", tag: "Watch", relevance: 62, pe: 48.2, pe5y: 35.0, filing: false, sentiment: "Bull",
    headline: { en: "Report: Adani Green may raise ₹8,000 cr via QIP", hinglish: "Report: Adani Green QIP se ₹8,000 cr jutaa sakti hai", hi: "रिपोर्ट: अदाणी ग्रीन QIP से ₹8,000 करोड़ जुटा सकती है" },
    tldr: {
      en: ["Media report, company has not confirmed", "Fund raise would dilute equity ~4%", "Valuation already stretched vs history"],
      hinglish: ["Sirf media report, company ne confirm nahi kiya", "Fund raise se equity ~4% dilute hogi", "Valuation pehle se mehenga hai"],
      hi: ["केवल मीडिया रिपोर्ट, कंपनी ने पुष्टि नहीं की", "धन जुटाने से इक्विटी लगभग 4% घटेगी", "मूल्यांकन पहले से ऊँचा है"],
    },
    impact: "Unclear until filing.", winners: [], losers: [], bull: "-", bear: "-", thesis: "Green Energy Capex",
    pattern: "Unconfirmed QIP reports: 60% materialised within 2 months.",
    timeline: [{ d: "Aug", e: "Board approves fund-raise enabling resolution" }, { d: "Today", e: "QIP report" }],
  },
  {
    id: "n3", time: "07:55 AM", source: "BSE Filing", quality: 5, verification: "Verified", tag: "Signal", relevance: 74, pe: 31.0, pe5y: 28.5, filing: true, sentiment: "Bull",
    headline: { en: "L&T wins ₹12,000 cr Middle East order", hinglish: "L&T ko Middle East se ₹12,000 cr ka order mila", hi: "एलएंडटी को मध्य पूर्व से ₹12,000 करोड़ का ऑर्डर" },
    tldr: {
      en: ["Order book now above ₹5 lakh cr", "Boosts FY26 revenue visibility", "EBITDA margin guidance unchanged"],
      hinglish: ["Order book ab ₹5 lakh cr se upar", "FY26 revenue visibility badhi", "EBITDA margin guidance same"],
      hi: ["ऑर्डर बुक अब ₹5 लाख करोड़ से ऊपर", "वित्त वर्ष 26 की आय की स्पष्टता बढ़ी", "EBITDA मार्जिन मार्गदर्शन अपरिवर्तित"],
    },
    impact: "Strengthens capex theme.", winners: ["LT", "KEC"], losers: [], bull: "Execution track record strong.", bear: "Middle East geopolitical risk.", thesis: "Infra Capex",
    pattern: "Large ME orders historically led to 4-6% move within a week.",
    timeline: [{ d: "Q1", e: "Order inflow soft" }, { d: "Oct", e: "₹7,000 cr domestic win" }, { d: "Today", e: "₹12,000 cr ME order" }],
  },
  {
    id: "n4", time: "07:10 AM", source: "Twitter Buzz", quality: 1, verification: "Pending", tag: "Noise", relevance: 20, pe: 85.0, pe5y: 60.0, filing: false, sentiment: "Bear",
    headline: { en: "Viral rumour: Zomato to exit quick commerce", hinglish: "Viral afwah: Zomato quick commerce chhodega", hi: "वायरल अफ़वाह: ज़ोमैटो क्विक कॉमर्स छोड़ेगा" },
    tldr: {
      en: ["No official source", "Contradicts recent management commentary", "Treat as noise until verified"],
      hinglish: ["Koi official source nahi", "Management ki recent baat ke ulta", "Verify hone tak noise samjho"],
      hi: ["कोई आधिकारिक स्रोत नहीं", "प्रबंधन के हालिया बयान के विपरीत", "पुष्टि तक शोर मानें"],
    },
    impact: "-", winners: [], losers: [], bull: "-", bear: "-", thesis: "Consumer Tech",
    pattern: "Unverified social rumours: 85% fizzled within 48 hours.",
    timeline: [{ d: "Today", e: "Rumour trends on X" }],
  },
];

export const EVENTS = [
  { date: "21 Nov", title: "HDFC Bank analyst meet", watch: true },
  { date: "22 Nov", title: "Infosys ex-dividend", watch: true },
  { date: "25 Nov", title: "L&T board meeting", watch: true },
  { date: "21 Nov", title: "US Jobless Claims", watch: false },
  { date: "28 Nov", title: "Monthly F&O expiry", watch: false },
  { date: "29 Nov", title: "India Q2 GDP data", watch: false },
  { date: "06 Dec", title: "RBI policy decision", watch: false },
];

export const FLOWS = [
  { d: "18 Nov", fii: -1240, dii: 2105 }, { d: "19 Nov", fii: 560, dii: 890 }, { d: "20 Nov", fii: -820, dii: 1430 },
];
export const SECTORS = [
  { s: "Bank", c: 0.8 }, { s: "IT", c: -1.2 }, { s: "Auto", c: 1.5 }, { s: "Pharma", c: 0.3 },
  { s: "FMCG", c: -0.4 }, { s: "Metal", c: 2.1 }, { s: "Realty", c: -1.8 }, { s: "Energy", c: 0.6 }, { s: "Infra", c: 1.1 },
];

export type Holding = {
  id: string; symbol: string; theme: string; qty: number; buyPrice: number; ltp: number;
  buyDate: string; conviction: "High" | "Med" | "Low"; reason: string; preMortem: string;
};
export const SEED_HOLDINGS: Holding[] = [
  { id: "h1", symbol: "HDFCBANK", theme: "Banking", qty: 60, buyPrice: 1520, ltp: 1745, buyDate: "2023-06-10", conviction: "High", reason: "Merger synergies", preMortem: "NIM stays compressed" },
  { id: "h2", symbol: "ICICIBANK", theme: "Banking", qty: 50, buyPrice: 1100, ltp: 1280, buyDate: "2025-03-02", conviction: "Med", reason: "Best-in-class ROE", preMortem: "Credit cost spike" },
  { id: "h3", symbol: "LT", theme: "Infra Capex", qty: 20, buyPrice: 3300, ltp: 3620, buyDate: "2024-01-15", conviction: "High", reason: "Order book", preMortem: "Govt capex slowdown" },
  { id: "h4", symbol: "TATAPOWER", theme: "Green Energy", qty: 100, buyPrice: 420, ltp: 395, buyDate: "2025-08-20", conviction: "Low", reason: "Renewables push", preMortem: "Debt overhang" },
];

export const sizingRange = { High: [8, 12], Med: [4, 7], Low: [1, 3] } as const;

/** STCG if held < 12 months, else LTCG (Indian listed equity). */
export function taxStatus(buyDate: string, today = new Date()) {
  const b = new Date(buyDate);
  const oneYear = new Date(b); oneYear.setFullYear(b.getFullYear() + 1);
  const days = Math.ceil((oneYear.getTime() - today.getTime()) / 86400000);
  return today >= oneYear ? { type: "LTCG" as const, rate: 12.5, daysToLtcg: 0 } : { type: "STCG" as const, rate: 20, daysToLtcg: days };
}
export function sizingVerdict(weight: number, c: Holding["conviction"]) {
  const [lo, hi] = sizingRange[c];
  return weight > hi ? "Oversized" : weight < lo ? "Undersized" : "OK";
}
export const THEME_LIMIT = 35;
