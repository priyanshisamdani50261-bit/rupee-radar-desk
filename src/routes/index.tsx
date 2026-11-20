import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/desk/Desk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MY MARKET DESK — Indian Stock Market Intelligence" },
      { name: "description", content: "Smart news cards, portfolio health, theme exposure and audio briefs for NIFTY & SENSEX investors." },
      { property: "og:title", content: "MY MARKET DESK" },
      { property: "og:description", content: "Indian stock market intelligence: signal over noise." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Desk,
});
