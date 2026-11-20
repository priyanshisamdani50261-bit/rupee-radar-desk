import { Link } from "@tanstack/react-router";
import { stockFor } from "./stocks";
export function StockLink({ symbol, label }: { symbol: string; label?: string }) {
  const stock = stockFor(symbol);
  return <Link className="font-bold underline decoration-dotted underline-offset-4 hover:text-gain" to="/stocks/$symbol" params={{ symbol: stock.symbol }}>{label ?? stock.symbol}</Link>;
}