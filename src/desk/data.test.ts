import { describe, it, expect } from "vitest";
import { taxStatus, sizingVerdict } from "./data";
describe("rules", () => {
  it("STCG under 1 year", () => expect(taxStatus("2026-01-01", new Date("2026-11-20")).type).toBe("STCG"));
  it("LTCG after 1 year", () => expect(taxStatus("2025-01-01", new Date("2026-11-20")).type).toBe("LTCG"));
  it("High conviction 15% is oversized", () => expect(sizingVerdict(15, "High")).toBe("Oversized"));
  it("Low conviction 2% is ok", () => expect(sizingVerdict(2, "Low")).toBe("OK"));
});
