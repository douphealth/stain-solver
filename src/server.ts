import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

// ---- Production static-site routing (stainsolver.shop) -------------------------------------
// The site is static HTML in public/. Cloudflare Pages serves those files before this Worker,
// so on the production host only "/" and URLs with no static file reach here. Serve the home
// page at "/" with a 200 (it was a noindex JS redirect), 301 alias hosts to the canonical domain
// and return a real 404 for everything else (no soft-404s or redirect chains for crawlers).
const CANONICAL_HOST = "stainsolver.shop";
const ALIAS_HOSTS = ["stain-solver.pages.dev", "www.stainsolver.shop"];
type AssetsBinding = { fetch: (r: Request) => Promise<Response> };

const NOT_FOUND_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | StainSolver</title><link rel="stylesheet" href="/assets/css/style.css"></head><body><main style="max-width:40rem;margin:4rem auto;padding:0 1rem;font-family:system-ui,sans-serif"><h1>Page not found</h1><p>That page doesn't exist. Try the <a href="/solve/">stain solver</a>, browse <a href="/guides/">all stain guides</a> or go to the <a href="/">home page</a>.</p></main></body></html>`;

async function staticSiteRouting(request: Request, env: unknown): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (ALIAS_HOSTS.includes(url.hostname)) {
    return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
  }
  if (url.hostname !== CANONICAL_HOST) return null; // Lovable preview / local dev keep the TanStack routes
  if (url.pathname === "/") {
    const target = new URL("/home", url);
    const assets = (env as { ASSETS?: AssetsBinding } | undefined)?.ASSETS;
    try {
      const res = assets ? await assets.fetch(new Request(target, { method: request.method })) : await fetch(target, { method: request.method });
      if (res.status === 200) {
        const headers = new Headers(res.headers);
        headers.delete("content-length");
        return new Response(request.method === "HEAD" ? null : res.body, { status: 200, headers });
      }
    } catch (error) {
      console.error(error);
    }
    return Response.redirect(`https://${CANONICAL_HOST}/home`, 302);
  }
  if (url.pathname === "/index.html") return Response.redirect(`https://${CANONICAL_HOST}/`, 301);
  return new Response(request.method === "HEAD" ? null : NOT_FOUND_HTML, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const routed = await staticSiteRouting(request, env);
    if (routed) return routed;
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
