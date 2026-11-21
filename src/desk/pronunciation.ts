export function preprocessSpeech(input: string) {
  return input.replace(/₹\s*([\d,.]+)\s*(?:Cr\.?|crore)\b/gi, "$1 Crore Rupees")
    .replace(/₹\s*([\d,.]+)/g, "$1 Rupees")
    .replace(/\bHDFCBANK\b/g, "HDFC Bank").replace(/\bICICIBANK\b/g, "ICICI Bank")
    .replace(/\bVIX\b/g, "Vicks").replace(/\bNIM\b/g, "Net Interest Margin")
    .replace(/\bYoY\b/gi, "Year on Year").replace(/\bQoQ\b/gi, "Quarter on Quarter")
    .replace(/\bQIP\b/g, "Qualified Institutional Placement").replace(/\bFII\b/g,"F I I").replace(/\bDII\b/g,"D I I")
    .replace(/P\/E/g,"Price to Earnings").replace(/%/g," percent").replace(/([.!?।])\s*/g,"$1\n\n");
}
export function voiceRank(v: { name: string; lang: string }) {
  const natural = /google|swara|neerja|natural|online/i.test(v.name);
  const indian = /^hi|en-IN/i.test(v.lang);
  return (natural ? 100 : 0) + (indian ? 50 : 0) + (/swara|neerja|google.*हिन्दी|google.*hindi/i.test(v.name) ? 25 : 0);
}