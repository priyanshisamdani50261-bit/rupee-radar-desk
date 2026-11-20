export type Stock = { symbol: string; name: string; sector: string; peers: string[]; upstream: string[]; downstream: string[]; policy: string; thesis: string };
export const STOCKS: Stock[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", peers: ["ICICIBANK", "SBIN"], upstream: ["Depositors", "Wholesale funding"], downstream: ["Retail borrowers", "Corporate borrowers"], policy: "RBI interest-rate policy", thesis: "Deposit growth and margin recovery" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", peers: ["HDFCBANK", "SBIN"], upstream: ["Depositors", "Wholesale funding"], downstream: ["Retail borrowers", "Corporate borrowers"], policy: "RBI interest-rate policy", thesis: "Credit quality and sustainable return on equity" },
  { symbol: "LT", name: "L&T", sector: "Infrastructure", peers: ["KEC"], upstream: ["Steel producers", "Equipment suppliers"], downstream: ["Government projects", "Middle East customers"], policy: "Public infrastructure spending", thesis: "Order conversion and execution discipline" },
  { symbol: "TATAPOWER", name: "Tata Power", sector: "Power", peers: ["ADANIGREEN"], upstream: ["Solar module suppliers", "Fuel suppliers"], downstream: ["Distribution utilities", "Industrial customers"], policy: "Renewable energy policy", thesis: "Renewable capacity growth without excessive leverage" },
  { symbol: "ADANIGREEN", name: "Adani Green", sector: "Renewable energy", peers: ["TATAPOWER"], upstream: ["Solar module suppliers", "Wind turbine suppliers"], downstream: ["Distribution utilities"], policy: "Renewable energy policy", thesis: "Capacity commissioning and balance-sheet discipline" },
  { symbol: "ETERNAL", name: "Zomato / Eternal", sector: "Consumer technology", peers: ["SWIGGY"], upstream: ["Restaurants", "Delivery partners"], downstream: ["Consumers", "Quick commerce customers"], policy: "Gig-worker regulation", thesis: "Profitable growth in food delivery and quick commerce" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", peers: ["HDFCBANK", "ICICIBANK"], upstream: ["Depositors"], downstream: ["Borrowers"], policy: "RBI interest-rate policy", thesis: "Credit costs and loan growth" },
  { symbol: "KEC", name: "KEC International", sector: "Infrastructure", peers: ["LT"], upstream: ["Steel producers"], downstream: ["Power utilities"], policy: "Transmission infrastructure spending", thesis: "Execution and working-capital discipline" },
  { symbol: "SWIGGY", name: "Swiggy", sector: "Consumer technology", peers: ["ETERNAL"], upstream: ["Restaurants"], downstream: ["Consumers"], policy: "Gig-worker regulation", thesis: "Unit economics and sustainable growth" },
];
export function stockFor(symbol: string): Stock {
  const key = symbol.trim().toUpperCase();
  return STOCKS.find(s => s.symbol === key) ?? { symbol: key, name: key, sector: "Not mapped", peers: [], upstream: [], downstream: [], policy: "Not mapped", thesis: "Research not yet populated" };
}
export function mentionedStocks(text: string) {
  return STOCKS.filter(s => text.toLowerCase().includes(s.symbol.toLowerCase()) || text.toLowerCase().includes((s.name.split(" / ")[0] ?? s.name).toLowerCase()));
}
export function convictionScore(value: number) { return Math.min(100, Math.max(0, Math.round(value))); }
export function relativeReturn(stock: number, benchmark: number) { return stock - benchmark; }