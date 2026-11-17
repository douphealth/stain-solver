import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const publicDir = join(root, "public");
const siteSource = readFileSync(join(root, "src/lib/site-url.ts"), "utf8");
const defaultMatch = siteSource.match(/DEFAULT_SITE_URL = "([^"]+)"/);
if (!defaultMatch) throw new Error("DEFAULT_SITE_URL missing from src/lib/site-url.ts");
const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || defaultMatch[1]).replace(
  /\/+$/,
  "",
);
const REVIEWED = "2026-11-01";
const OG_IMAGE_PATH = "/assets/img/share-card.png";
const OG_ALT = "Stain Solver — spilled something? Start here.";
const INDEXABLE_ROBOTS = "index,follow,max-image-preview:large";

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function strip(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function escapeText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}

function clamp(value, max) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const word = cut.lastIndexOf(" ");
  const base = (word > 40 ? cut.slice(0, word) : cut).replace(/[.,;:\s]+$/, "");
  return `${base}…`;
}

function pngSize(path) {
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function pageKind(rel) {
  if (rel === "home.html") return "home";
  if (rel === "404.html" || rel === "index.html") return "skip";
  if (rel === "solve/index.html") return "solve";
  if (rel === "guides/index.html") return "directory";
  if (rel === "about/index.html") return "about";
  if (rel === "privacy/index.html") return "privacy";
  if (rel.startsWith("guides/") && rel.endsWith("/index.html")) return "guide";
  throw new Error(`Unexpected HTML file: ${rel}`);
}

function pagePath(rel, kind) {
  if (kind === "home") return "/";
  return `/${rel.replace(/index\.html$/, "")}`;
}

function h1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!match) throw new Error("Missing h1");
  return strip(match[1]).replace(/\.$/, "");
}

function existingTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!match) throw new Error("Missing title");
  return strip(match[1]);
}

function existingDescription(html) {
  const match = html.match(/<meta name="description" content="([\s\S]*?)">/);
  if (!match) throw new Error("Missing description");
  return strip(match[1]);
}

function whyText(html) {
  const match = html.match(/<h2>Why[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/);
  return match ? strip(match[1]) : "";
}

function firstMove(html) {
  const match = html.match(/<div class="first-move">[\s\S]*?<p>([\s\S]*?)<\/p>/);
  return match ? strip(match[1]) : "";
}

function steps(html) {
  const found = [];
  const re =
    /<li><span class="guide-step-num">(\d+)<\/span><div><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/div><\/li>/g;
  for (const match of html.matchAll(re)) {
    found.push({ position: Number(match[1]), name: strip(match[2]), text: strip(match[3]) });
  }
  return found;
}

function supplies(html) {
  const match = html.match(/<h3>Your small supply list<\/h3><ul>([\s\S]*?)<\/ul>/);
  if (!match) return [];
  return [...match[1].matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map((item) => strip(item[1]).replace(/^✓\s*/, ""))
    .filter(Boolean);
}

function faqs(html) {
  const found = [];
  const re = /<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g;
  for (const match of html.matchAll(re)) {
    found.push({ question: strip(match[1]), answer: strip(match[2]) });
  }
  return found;
}

function directoryCards(html) {
  const cards = [];
  const re = /<a class="directory-card" href="([^"]+)"[\s\S]*?<h2>([\s\S]*?)<\/h2>/g;
  for (const match of html.matchAll(re)) {
    cards.push({ href: match[1], name: strip(match[2]) });
  }
  return cards;
}

function guideDescription(name, why) {
  const sentences = why.split(/(?<=\.)\s/).filter(Boolean);
  let text = `${name}:`;
  for (const sentence of sentences) {
    const candidate = `${text} ${sentence}`;
    if (candidate.length > 160) break;
    text = candidate;
  }
  if (text === `${name}:`) return clamp(`${name}: ${sentences[0] ?? why}`, 160);
  return text;
}

function jsonScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function breadcrumbNav(items) {
  const parts = items.map((item) =>
    item.current
      ? `<span aria-current="page">${escapeText(item.name)}</span>`
      : `<a href="${escapeAttr(item.href)}">${escapeText(item.name)}</a>`,
  );
  return `<nav class="back-breadcrumb" aria-label="Breadcrumb">${parts.join('<span aria-hidden="true">/</span>')}</nav>`;
}

function breadcrumbLd(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function orgRef() {
  return { "@type": "Organization", name: "Stain Solver", url: `${SITE_URL}/` };
}

const imageSize = pngSize(join(publicDir, OG_IMAGE_PATH.slice(1)));
if (!imageSize) throw new Error("Could not read share card dimensions");
const imageUrl = `${SITE_URL}${OG_IMAGE_PATH}`;

const pages = [];
for (const file of walk(publicDir).filter((path) => path.endsWith(".html")).sort()) {
  const rel = relative(publicDir, file);
  const kind = pageKind(rel);
  if (kind === "skip") continue;
  const html = readFileSync(file, "utf8");
  const name = h1(html);
  const path = pagePath(rel, kind);
  const url = `${SITE_URL}${path}`;
  const title = existingTitle(html);
  const priorDescription = existingDescription(html);
  let description = priorDescription;
  let nextTitle = title.length <= 60 ? title : clamp(`${name} | Stain Solver`, 60).replace(/…$/, "");
  if (kind === "guide") {
    const why = whyText(html);
    if (!why) throw new Error(`No why paragraph in ${rel}`);
    description = guideDescription(name, why);
    if (`${name} | Stain Solver`.length <= 60 && title.length > 60) nextTitle = `${name} | Stain Solver`;
  }
  if (nextTitle.length > 60) throw new Error(`Title too long (${nextTitle.length}): ${nextTitle}`);
  if (description.length > 160) throw new Error(`Description too long (${description.length}) in ${rel}`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) throw new Error(`Expected one h1 in ${rel}`);
  pages.push({ file, rel, kind, html, name, path, url, title: nextTitle, description });
}

const titles = new Set();
const descriptions = new Set();
for (const page of pages) {
  if (page.kind === "solve") continue;
  if (titles.has(page.title)) throw new Error(`Duplicate title: ${page.title}`);
  if (descriptions.has(page.description)) throw new Error(`Duplicate description: ${page.description}`);
  titles.add(page.title);
  descriptions.add(page.description);
}

const directory = pages.find((page) => page.kind === "directory");
const cards = directoryCards(directory.html);
if (cards.length < 2) throw new Error("Guide directory did not parse");

function graphFor(page) {
  const crumbs = [{ name: "Home", href: "/", item: `${SITE_URL}/`, current: page.kind === "home" }];
  if (page.kind === "directory") {
    crumbs.push({ name: "Stain guides", href: "/guides/", item: page.url, current: true });
  } else if (page.kind === "guide") {
    crumbs.push({ name: "Stain guides", href: "/guides/", item: `${SITE_URL}/guides/`, current: false });
    crumbs.push({ name: page.name, href: page.path, item: page.url, current: true });
  } else if (page.kind === "about") {
    crumbs.push({ name: "Our method and sources", href: "/about/", item: page.url, current: true });
  } else if (page.kind === "privacy") {
    crumbs.push({ name: "Privacy", href: "/privacy/", item: page.url, current: true });
  } else if (page.kind === "solve") {
    crumbs.push({ name: "Stain plan", href: "/solve/", item: page.url, current: true });
  }

  if (page.kind === "home") {
    const questions = faqs(page.html);
    if (questions.length < 1) throw new Error("Home FAQ missing");
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Stain Solver",
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/assets/img/icon-512.png`,
          description:
            "Material-aware care for real life. Useful instructions, visible sources, and clear stop rules.",
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Stain Solver",
          url: `${SITE_URL}/`,
          description: page.description,
          publisher: { "@id": `${SITE_URL}/#organization` },
          inLanguage: "en",
        },
        {
          "@type": "WebApplication",
          name: "Stain Solver",
          url: `${SITE_URL}/`,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          description:
            "Stain first-aid guidance with fabric-specific precautions, material-aware stop rules, practical steps and publisher sources.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          isAccessibleForFree: true,
        },
        {
          "@type": "FAQPage",
          mainEntity: questions.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        },
      ],
    };
  }

  const graph = [breadcrumbLd(crumbs)];
  if (page.kind === "directory") {
    graph.unshift({
      "@type": "CollectionPage",
      name: page.name,
      url: page.url,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: {
        "@type": "ItemList",
        name: "Stain removal guides",
        numberOfItems: cards.length,
        itemListElement: cards.map((card, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: card.name,
          url: `${SITE_URL}${card.href}`,
        })),
      },
    });
  } else if (page.kind === "guide") {
    const guideSteps = steps(page.html);
    if (guideSteps.length < 1) throw new Error(`No steps in ${page.rel}`);
    const supply = supplies(page.html);
    const howTo = {
      "@type": "HowTo",
      name: page.name,
      description: firstMove(page.html) || page.description,
      step: guideSteps.map((step) => ({
        "@type": "HowToStep",
        position: step.position,
        name: step.name,
        text: step.text,
      })),
    };
    if (supply.length) {
      howTo.supply = supply.map((item) => ({ "@type": "HowToSupply", name: item }));
    }
    graph.unshift(
      {
        "@type": "Article",
        headline: page.name,
        description: page.description,
        datePublished: REVIEWED,
        dateModified: REVIEWED,
        author: orgRef(),
        publisher: orgRef(),
        mainEntityOfPage: page.url,
        inLanguage: "en",
      },
      howTo,
    );
  } else if (page.kind === "about") {
    graph.unshift({
      "@type": "AboutPage",
      name: "Our method and sources",
      url: page.url,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      dateModified: REVIEWED,
    });
  } else if (page.kind === "privacy") {
    graph.unshift({
      "@type": "WebPage",
      name: "Privacy and offline use",
      url: page.url,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function applyBreadcrumb(page) {
  if (page.html.includes('aria-label="Breadcrumb"')) return page.html;
  if (page.kind === "guide") {
    const nav = breadcrumbNav([
      { name: "Home", href: "/" },
      { name: "Stain guides", href: "/guides/" },
      { name: page.name, current: true },
    ]);
    const anchor = '<a class="back-breadcrumb" href="/guides/">← ALL STAIN GUIDES</a>';
    if (!page.html.includes(anchor)) throw new Error(`Missing guide breadcrumb anchor in ${page.rel}`);
    return page.html.replace(anchor, nav);
  }
  if (page.kind === "solve") {
    const nav = breadcrumbNav([
      { name: "Home", href: "/" },
      { name: "Stain plan", current: true },
    ]);
    const anchor = '<a class="back-breadcrumb" href="/">← BACK TO THE STAIN DESK</a>';
    if (!page.html.includes(anchor)) throw new Error("Missing solve breadcrumb anchor");
    return page.html.replace(anchor, nav);
  }
  if (page.kind === "home") return page.html;
  const current =
    page.kind === "directory"
      ? "Stain guides"
      : page.kind === "about"
        ? "Our method and sources"
        : "Privacy";
  const nav = breadcrumbNav([
    { name: "Home", href: "/" },
    { name: current, current: true },
  ]);
  const host = '<main id="main" class="editorial-page"><div class="wrap">';
  if (!page.html.includes(host)) throw new Error(`Missing editorial wrap in ${page.rel}`);
  return page.html.replace(host, `${host}${nav}`);
}

function applyHead(page, html) {
  const robots = page.kind === "solve" ? "noindex, follow" : INDEXABLE_ROBOTS;
  const ogType = page.kind === "guide" ? "article" : "website";
  let next = html
    .replace(/<!--site-meta-->[\s\S]*?<!--\/site-meta-->/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  next = next.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeText(page.title)}</title>`);
  next = next.replace(
    /<meta name="description" content="[\s\S]*?">/,
    () => `<meta name="description" content="${escapeAttr(page.description)}">`,
  );
  next = next.replace(
    /<meta name="robots" content="[\s\S]*?">/,
    () => `<meta name="robots" content="${robots}">`,
  );
  const block = `<!--site-meta--><link rel="canonical" href="${escapeAttr(page.url)}"><meta property="og:site_name" content="Stain Solver"><meta property="og:title" content="${escapeAttr(page.title)}"><meta property="og:description" content="${escapeAttr(page.description)}"><meta property="og:type" content="${ogType}"><meta property="og:url" content="${escapeAttr(page.url)}"><meta property="og:image" content="${imageUrl}"><meta property="og:image:alt" content="${escapeAttr(OG_ALT)}"><meta property="og:image:width" content="${imageSize.width}"><meta property="og:image:height" content="${imageSize.height}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttr(page.title)}"><meta name="twitter:description" content="${escapeAttr(page.description)}"><meta name="twitter:image" content="${imageUrl}"><meta name="twitter:image:alt" content="${escapeAttr(OG_ALT)}">${jsonScript(graphFor(page))}<!--/site-meta-->`;
  if (!next.includes('<meta name="robots"')) throw new Error(`robots meta missing in ${page.rel}`);
  next = next.replace('<meta name="robots"', () => `${block}<meta name="robots"`);
  // The block was inserted BEFORE robots. Move is unnecessary if order is canonical then robots.
  // Keep robots before the social block so the existing head order stays readable.
  next = next.replace(block, "");
  next = next.replace(
    /<meta name="robots" content="[\s\S]*?">/,
    (robotsTag) => `${robotsTag}${block}`,
  );
  return next;
}

for (const page of pages) {
  const withCrumbs = applyBreadcrumb(page);
  const stamped = applyHead(page, withCrumbs);
  if ((stamped.match(/<h1[\s>]/g) ?? []).length !== 1) throw new Error(`H1 count changed in ${page.rel}`);
  if (!stamped.includes(`rel="canonical" href="${page.url}"`)) {
    throw new Error(`Canonical missing for ${page.url}`);
  }
  writeFileSync(page.file, stamped);
  page.html = stamped;
}

const home = pages.find((page) => page.kind === "home");
writeFileSync(join(publicDir, "index.html"), home.html);

const indexable = pages.filter((page) => page.kind !== "solve");
const urls = [
  indexable.find((page) => page.kind === "home"),
  indexable.find((page) => page.kind === "directory"),
  indexable.find((page) => page.kind === "about"),
  indexable.find((page) => page.kind === "privacy"),
  ...cards.map((card) => {
    const match = indexable.find((page) => page.path === card.href);
    if (!match) throw new Error(`Sitemap missing guide ${card.href}`);
    return match;
  }),
];
if (new Set(urls.map((page) => page.path)).size !== urls.length) throw new Error("Duplicate sitemap paths");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(
    (page) =>
      `  <url><loc>${escapeText(page.url)}</loc><lastmod>${REVIEWED}</lastmod></url>`,
  )
  .join("\n")}\n</urlset>\n`;
writeFileSync(join(publicDir, "sitemap.xml"), sitemap);

const robots = `# Stain Solver (${SITE_URL})
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(publicDir, "robots.txt"), robots);

const solve = pages.find((page) => page.kind === "solve");
const llms = `# Stain Solver

> ${home.description}

Stain Solver is a free, account-free household guide. It turns published cleaning and textile-care sources into cautious, fabric-specific first steps. It does not claim laboratory testing, guaranteed removal, or a live inspection of a garment. The care label and the maker's directions come first.

## Pages

- [Home](${home.url}): ${home.description}
- [Stain guides](${directory.url}): ${directory.description}
- [How our advice works](${pages.find((page) => page.kind === "about").url}): ${pages.find((page) => page.kind === "about").description}
- [Privacy](${pages.find((page) => page.kind === "privacy").url}): ${pages.find((page) => page.kind === "privacy").description}
- [Interactive stain desk](${solve.url}): ${solve.description} Plans are built in the browser. This address is a utility page and is not intended for indexing.

## Guides

${cards.map((card) => `- [${card.name}](${SITE_URL}${card.href}): ${indexable.find((page) => page.path === card.href).description}`).join("\n")}
`;
writeFileSync(join(publicDir, "llms.txt"), llms);

const keyFiles = readdirSync(publicDir).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
let keyName = keyFiles[0];
if (!keyName) {
  keyName = `${randomBytes(16).toString("hex")}.txt`;
  writeFileSync(join(publicDir, keyName), keyName.slice(0, -4));
}
for (const extra of keyFiles.slice(1)) {
  throw new Error(`Multiple IndexNow keys found: ${extra}`);
}

console.log(`SITE_URL=${SITE_URL}`);
console.log(`indexable=${urls.length} guides=${cards.length} indexnow=${keyName}`);
for (const page of pages) {
  console.log(`${page.title.length}\t${page.description.length}\t${page.kind}\t${page.path}\t${page.title}`);
}
