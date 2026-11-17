import "./lib/error-capture";

import homeDocument from "../public/index.html?raw";
import notFoundDocument from "../public/404.html?raw";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const LEGACY_HOME_PATHS = new Set(["/home", "/home/", "/home.html", "/index.html"]);

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
function documentResponse(body: string | null, status: number, robots?: string) {
  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=0, must-revalidate",
    "x-content-type-options": "nosniff",
  });
  if (robots) headers.set("x-robots-tag", robots);
  return new Response(body, { status, headers });
}

async function isAppShell(response: Response): Promise<boolean> {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) return false;
  const body = await response.clone().text();
  return (
    body.includes("$_TSR") || body.includes("Lovable App") || body.includes('content="Lovable"')
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const read = request.method === "GET" || request.method === "HEAD";
    try {
      if (read && LEGACY_HOME_PATHS.has(url.pathname)) {
        const target = new URL("/", url.origin);
        return new Response(null, { status: 301, headers: { location: target.toString() } });
      }
      if (read && (url.pathname === "/" || url.pathname === "")) {
        if (url.search === "?") {
          return new Response(null, {
            status: 301,
            headers: { location: new URL("/", url.origin).toString() },
          });
        }
        return documentResponse(request.method === "HEAD" ? null : homeDocument, 200);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      if (normalized.status === 404 || (normalized.status === 200 && (await isAppShell(normalized)))) {
        return documentResponse(
          request.method === "HEAD" ? null : notFoundDocument,
          404,
          "noindex, follow",
        );
      }
      return normalized;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-robots-tag": "noindex, follow",
        },
      });
    }
  },
};
