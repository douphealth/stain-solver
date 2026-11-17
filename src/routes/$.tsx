import { createFileRoute, notFound } from "@tanstack/react-router";

// Content URLs are static files in public/ and are served before this route.
// A request that reaches here is not a page, so it is a real 404.
export const Route = createFileRoute("/$")({
  beforeLoad: () => {
    throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Page not found | Stain Solver" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: () => null,
});
