import { createFileRoute, redirect } from "@tanstack/react-router";

// The StainSolver site is static HTML in public/; send / to its home page.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StainSolver — Stain removal guides" },
      { name: "description", content: "Find the safest way to remove any stain from any fabric." },
      { property: "og:title", content: "StainSolver — Stain removal guides" },
      { property: "og:description", content: "Find the safest way to remove any stain from any fabric." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ href: "/home.html", reloadDocument: true });
  },
});
