import { describe, it, expect } from "vitest";
import { convictionScore, relativeReturn, mentionedStocks } from "./stocks";
import { parseFeed, RSS_SOURCES } from "./rss";
describe("Stock research rules", () => {
  it("caps conviction at 100", () => expect(convictionScore(120)).toBe(100));
  it("floors conviction at 0", () => expect(convictionScore(-10)).toBe(0));
  it("compares stock return against NIFTY return", () => expect(relativeReturn(12.8, 16.4)).toBeCloseTo(-3.6));
  it("recognizes stock names in news", () => expect(mentionedStocks("HDFC Bank reports results")[0]?.symbol).toBe("HDFCBANK"));
  it("uses all three requested RSS sources", () => expect(RSS_SOURCES.map(s => new URL(s.url).hostname)).toEqual(["www.bseindia.com", "economictimes.indiatimes.com", "www.moneycontrol.com"]));
  it("rejects blocked HTML instead of presenting it as news", () => expect(() => parseFeed("<html><body>Consent</body></html>", "Moneycontrol")).toThrow());
  it("rejects unsafe article links", () => expect(parseFeed('<rss><channel><item><title>News</title><link>javascript:alert(1)</link></item></channel></rss>', "BSE Notices")).toEqual([]));
});