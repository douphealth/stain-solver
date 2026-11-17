// @ts-nocheck -- engine is plain browser JS shipped in public/
import { buildPlan, checkCleanerCombination } from "../../public/assets/js/engine.js";
import { SURFACES, STAINS, AGES } from "../../public/assets/js/data.js";

const kinds = (p) => p.steps.map((s) => s.title).join(" | ");

describe("stain engine safety rules", () => {
  it("dry-clean-only label stops home wet cleaning", () => {
    const p = buildPlan({ stainId: "coffee", surfaceId: "white-cotton", ageId: "fresh", care: "dry-clean" });
    expect(p.status).toBe("pro");
    expect(kinds(p)).toContain("Stop home wet-cleaning");
  });
  it("unknown sofa code gives no wet-cleaning steps", () => {
    const p = buildPlan({ stainId: "red-wine", surfaceId: "sofa", ageId: "fresh" });
    expect(p.status).toBe("pro");
    expect(kinds(p)).not.toContain("Patch-test");
  });
  it("X-code sofa is vacuum only", () => {
    const p = buildPlan({ stainId: "mud", surfaceId: "sofa", ageId: "dried", upholsteryCode: "x" });
    expect(kinds(p)).toContain("vacuum-only");
  });
  it("unknown material never recommends a cleaner", () => {
    const p = buildPlan({ stainId: "ink", surfaceId: "unknown-material", ageId: "fresh" });
    expect(p.status).toBe("pro");
    expect(kinds(p)).toContain("Identify the material");
  });
  it("a product already applied adds a no-second-cleaner step and downgrades 'go'", () => {
    const p = buildPlan({ stainId: "coffee", surfaceId: "white-cotton", ageId: "fresh", tried: "product" });
    expect(p.steps[0].title).toContain("product may already be on");
    expect(p.status).not.toBe("go");
  });
  it("invalid 'tried' input falls back to cautious", () => {
    const p = buildPlan({ stainId: "coffee", surfaceId: "white-cotton", ageId: "fresh", tried: "<x>" });
    expect(p.tried).toBe("unsure");
  });
  it("invalid stain or material returns no plan", () => {
    expect(buildPlan({ stainId: "nope", surfaceId: "wool", ageId: "fresh" })).toBeNull();
  });
  it("every combination builds a plan with sources and a stop rule", () => {
    for (const s of STAINS) for (const m of SURFACES) for (const a of AGES) {
      const p = buildPlan({ stainId: s.id, surfaceId: m.id, ageId: a.id });
      expect(p.sources.length).toBeGreaterThan(0);
      expect(p.stop).toBeTruthy();
    }
  });
  it("cleaner checker never returns a safe verdict", () => {
    const ids = ["bleach", "ammonia", "acid", "alcohol", "peroxide", "detergent", "dish", "unknown"];
    for (const a of ids) for (const b of ids) expect(["danger", "caution"]).toContain(checkCleanerCombination(a, b).risk);
  });
  it("bleach with anything is flagged danger", () => {
    expect(checkCleanerCombination("bleach", "acid").risk).toBe("danger");
  });
});
