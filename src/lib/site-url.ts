/**
 * Single production origin for canonical URLs, Open Graph, the sitemap, and robots.
 * scripts/apply-seo.mjs reads DEFAULT_SITE_URL from this file.
 * Override at build time with SITE_URL or VITE_SITE_URL (no trailing slash).
 */
export const DEFAULT_SITE_URL = "https://stainsolver.shop";

const configured = import.meta.env["VITE_SITE_URL"];
export const SITE_URL = (
  typeof configured === "string" && configured.length > 0 ? configured : DEFAULT_SITE_URL
).replace(/\/+$/, "");
