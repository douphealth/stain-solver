import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// The StainSolver site is static HTML in public/. Redirect in the browser so
// anchors like /#solver survive (a server redirect would drop the #hash).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StainSolver — Stain removal guides" },
      { name: "description", content: "Find the safest way to remove any stain from any fabric." },
      { property: "og:title", content: "StainSolver — Stain removal guides" },
      { property: "og:description", content: "Find the safest way to remove any stain from any fabric." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Redirect,
});

function Redirect() {
  useEffect(() => {
    window.location.replace("/home.html" + window.location.search + window.location.hash);
  }, []);
  return null;
}
