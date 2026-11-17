import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_SITE_URL } from "@/lib/site-url";

const publicDir = join(process.cwd(), "public");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function htmlFiles(): string[] {
  return walk(publicDir).filter((path) => path.endsWith(".html"));
}

describe("search metadata", () => {
  it("serves an indexable homepage with absolute canonical and structured data", () => {
    const html = readFileSync(join(publicDir, "index.html"), "utf8");
    expect(html).toBe(readFileSync(join(publicDir, "home.html"), "utf8"));
    expect(html).toContain(`<link rel="canonical" href="${DEFAULT_SITE_URL}/">`);
    expect(html).toContain('name="robots" content="index,follow,max-image-preview:large"');
    expect(html).toContain('property="og:url" content="https://stainsolver.shop/"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).not.toMatch(/lovable|gpteng/i);

    const data = JSON.parse(
      html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "",
    ) as { "@graph": Array<{ "@type": string }> };
    const types = data["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "WebApplication", "FAQPage"]));
  });

  it("gives every content page one h1, a short title, and a unique description", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const file of htmlFiles()) {
      const html = readFileSync(file, "utf8");
      const rel = relative(publicDir, file);
      expect(html.match(/<h1[\s>]/g), rel).toHaveLength(1);
      const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      const description = html.match(/name="description" content="([\s\S]*?)"/)?.[1] ?? "";
      const decodedTitle = title.replace(/&amp;/g, "&");
      expect(decodedTitle.length, rel).toBeLessThanOrEqual(60);
      expect(description.length, `${rel} description`).toBeLessThanOrEqual(160);
      expect(description.length, rel).toBeGreaterThan(40);
      if (rel === "404.html") {
        expect(html).toContain('content="noindex, follow"');
        continue;
      }
      expect(html, rel).toContain(`<link rel="canonical" href="${DEFAULT_SITE_URL}/`);
      if (rel === "solve/index.html") {
        expect(html).toContain('content="noindex, follow"');
        continue;
      }
      if (rel === "home.html") continue;
      expect(titles.has(decodedTitle), decodedTitle).toBe(false);
      expect(descriptions.has(description), description).toBe(false);
      titles.add(decodedTitle);
      descriptions.add(description);
      expect(html, rel).not.toContain("noindex");
    }
  });

  it("publishes xml sitemap, robots, llms.txt, and an IndexNow key", () => {
    const sitemap = readFileSync(join(publicDir, "sitemap.xml"), "utf8");
    expect(sitemap.startsWith("<?xml")).toBe(true);
    const locs = sitemap.match(/<loc>([^<]+)<\/loc>/g) ?? [];
    expect(locs).toHaveLength(38);
    expect(sitemap).not.toContain("/solve/");
    expect(sitemap).toContain(`${DEFAULT_SITE_URL}/guides/coffee-on-white-cotton/`);
    expect(sitemap).toContain("<lastmod>2026-11-01</lastmod>");

    const robots = readFileSync(join(publicDir, "robots.txt"), "utf8");
    for (const agent of [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "PerplexityBot",
      "ClaudeBot",
      "Google-Extended",
      "Applebot-Extended",
      "Bingbot",
    ]) {
      expect(robots).toContain(`User-agent: ${agent}`);
    }
    expect(robots).toContain(`Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`);
    expect(robots).not.toMatch(/Disallow:\s+\//);

    const llms = readFileSync(join(publicDir, "llms.txt"), "utf8");
    expect(llms).toContain(`# Stain Solver`);
    expect(llms).toContain(`${DEFAULT_SITE_URL}/guides/`);

    const keys = readdirSync(publicDir).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
    expect(keys).toHaveLength(1);
    const key = keys[0] ?? "";
    expect(readFileSync(join(publicDir, key), "utf8")).toBe(key.slice(0, -4));

    const solve = readFileSync(join(publicDir, "solve/index.html"), "utf8");
    expect(solve).toContain('content="noindex, follow"');
    expect(solve).toContain(`href="${DEFAULT_SITE_URL}/solve/"`);
  });
});
