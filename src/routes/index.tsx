import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/site-url";

// `/` is the static homepage in public/index.html. src/server.ts serves that
// document so the response is crawlable HTML, including hash links such as
// /#solver. This route only keeps `/` matched if the static file is not used.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stain Solver — Spilled something? Start here." },
      {
        name: "description",
        content:
          "Spilled coffee, wine or grease? Get a stain-removal first move tailored to your fabric. Three quick choices, practical steps, and source-backed safety guidance.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "Stain Solver — Spilled something? Start here." },
      {
        property: "og:description",
        content:
          "Spilled coffee, wine or grease? Get a stain-removal first move tailored to your fabric. Three quick choices, practical steps, and source-backed safety guidance.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: () => null,
});
