import { createFileRoute } from "@tanstack/react-router";
import { Research } from "@/desk/Research";
import { stockFor } from "@/desk/stocks";
import { ThesisChecklist } from "@/desk/ThesisChecklist";
export const Route = createFileRoute("/stocks/$symbol")({
  head: ({ params }) => { const s = stockFor(params.symbol); return { meta: [
    { title: `${s.name} — Deep Research | MY MARKET DESK` },
    { name: "description", content: `Thesis, supply chain, management commitments and opportunity cost for ${s.name}.` },
    { property: "og:title", content: `${s.name} — Stock Deep Research` },
    { property: "og:description", content: `Explore ${s.name} on MY MARKET DESK.` },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }; },
  component: StockPage,
});
function StockPage() { const { symbol } = Route.useParams(); return <Research key={symbol} symbol={symbol} notes={<ThesisChecklist />} />; }