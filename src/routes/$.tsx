import { createFileRoute, redirect } from "@tanstack/react-router";

// StainSolver pages are static folders in public/ (e.g. /about/index.html).
// Send folder-style links to the matching static page.
export const Route = createFileRoute("/$")({
  beforeLoad: ({ params }) => {
    const path = (params._splat ?? "").replace(/\/+$/, "");
    if (path && !path.includes(".")) {
      throw redirect({ href: `/${path}/index.html`, reloadDocument: true });
    }
  },
  component: () => null,
});
