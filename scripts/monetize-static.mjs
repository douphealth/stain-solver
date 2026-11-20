// Applies monetize.json to the static site in public/: Amazon "supplies" blocks in guides, optional AdSense
// head script + ads.txt, and the matching privacy notice. Idempotent: re-run after changing monetize.json.
//   node scripts/monetize-static.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";

const cfg = JSON.parse(readFileSync(process.env.MONETIZE_CONFIG || "monetize.json", "utf8"));
const TAG = (cfg.amazon?.tag ?? "").trim(), DOMAIN = cfg.amazon?.domain || "www.amazon.com", ADS = (cfg.adsenseClient ?? "").trim();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const strip = (html, name) => html.split(`<!--${name}-->`).map((part, i) => (i === 0 ? part : part.slice(part.indexOf(`<!--/${name}-->`) + `<!--/${name}-->`.length))).join("");

// Only items the guide's own supply list names; non-products (labels, instructions, professionals) are skipped.
const SUPPLY = [
  [/white absorbent cloth/i, "Plain white cleaning cloths", "white cotton cleaning cloths", "Plain white cloths won't transfer dye while you blot."],
  [/laundry detergent/i, "Laundry detergent", "laundry detergent", "Choose one your garment's care label allows."],
  [/white towels/i, "White cotton towels", "white cotton towels", "For pressing out moisture without leaving dye behind."],
  [/dish liquid/i, "Clear, dye-free dish liquid", "clear dye free dish soap", "Only use it where the maker approves, as the guide says."],
  [/lint-free cloth/i, "Lint-free cloths", "lint free cleaning cloths", "Blot without leaving fibres on the surface."],
  [/wool detergent/i, "Wool wash detergent", "wool wash detergent", "Only if the item is washable, as the guide says."],
  [/enzyme laundry pre-treatment/i, "Enzyme laundry pre-treatment", "enzyme laundry stain pretreatment", "For protein stains such as blood. Not for wool or silk."],
  [/enzyme stain remover/i, "Enzyme stain remover for upholstery", "enzyme stain remover upholstery mattress", "Use sparingly and follow its dwell time, as the guide says."],
  [/hydrogen peroxide/i, "3% hydrogen peroxide", "hydrogen peroxide 3 percent", "White fabrics only, and only after a hidden test."],
  [/isopropyl alcohol/i, "Isopropyl (rubbing) alcohol", "isopropyl alcohol 70 percent", "Test on a hidden seam first; not for acetate fabrics."],
  [/ice pack/i, "Reusable ice packs", "reusable ice packs", "Hardens gum or wax so it lifts off in pieces."],
  [/non-acetone/i, "Non-acetone nail polish remover", "non acetone nail polish remover", "Gentler on carpet fibres than acetone; still test first."],
  [/oxygen bleach/i, "Oxygen bleach powder", "oxygen bleach powder laundry", "Only where the garment's bleach symbol allows it."],
  [/carpet spot cleaner/i, "Carpet spot cleaner", "carpet spot stain remover", "Pick one suited to your carpet fibre, and test first."],
  [/white vinegar/i, "Distilled white vinegar", "distilled white vinegar cleaning", "Test it on a hidden seam first, as the guide says."],
  [/soft brush/i, "Soft-bristle cleaning brush", "soft bristle laundry stain brush", "Works stains loose without roughing up the fabric."],
  [/pet urine enzyme cleaner/i, "Pet urine enzyme cleaner", "pet urine enzyme cleaner carpet", "Breaks down odour so pets are less likely to return to the spot."],
  [/fabric rust remover/i, "Fabric-safe rust remover", "fabric rust stain remover", "Choose one labelled safe for fabric; wear gloves and rinse well."],
  [/baking soda/i, "Baking soda", "baking soda", "Absorbs moisture and odour before you vacuum it up."],
  [/disposable gloves/i, "Disposable gloves", "disposable nitrile gloves", "Protect your hands when cleaning up after illness."],
  [/^urine enzyme cleaner/i, "Urine enzyme cleaner", "urine enzyme cleaner mattress", "Breaks down the compounds that cause urine odour."],
  [/acetone nail polish remover/i, "Acetone nail polish remover", "acetone nail polish remover", "Dissolves cured glue. Never on acetate or modacrylic; test first."],
  [/paper towels/i, "Paper towels", "paper towels", "For blotting and for lifting wax with a low iron."],
  [/mattress protector/i, "Waterproof mattress protector", "waterproof mattress protector", "Prevents the next stain from reaching the mattress."],
];
// Homepage: the four supplies the guides call for most often.
const HOME_PICKS = [
  [null, "Enzyme laundry pre-treatment", "enzyme laundry stain pretreatment", "For protein stains such as blood, sweat and food. Not for wool or silk."],
  [null, "Oxygen bleach powder", "oxygen bleach powder laundry", "Colour-safe bleach, only where a garment's bleach symbol allows it."],
  [null, "Plain white cleaning cloths", "white cotton cleaning cloths", "Plain white cloths won't transfer dye while you blot."],
  [null, "Carpet spot cleaner", "carpet spot stain remover", "Pick one suited to your carpet fibre, and test first."],
];
const url = (q) => `https://${DOMAIN}/s?k=${encodeURIComponent(q)}&tag=${encodeURIComponent(TAG)}`;

function picksFor(html) {
  const list = (html.match(/Your small supply list<\/h3><ul>([\s\S]*?)<\/ul>/) ?? [])[1] ?? "";
  const items = [...list.matchAll(/✓ ([^<]+)/g)].map((m) => m[1]);
  const seen = new Set();
  return SUPPLY.filter(([re]) => items.some((i) => re.test(i))).filter(([, l]) => !seen.has(l) && seen.add(l));
}

function amazonBlock(picks) {
  const li = picks.map(([, label, q, why]) => `<li><a href="${esc(url(q))}" target="_blank" rel="sponsored nofollow noopener" data-offer="amazon" style="display:block;padding:.85rem 1rem;border:1px solid var(--line,#ddd);border-radius:12px;text-decoration:none;color:inherit"><strong>${esc(label)}</strong><br><span style="color:var(--muted,#666);font-size:.92em">${esc(why)}</span><br><span style="font-weight:600">See options on Amazon ↗</span></a></li>`).join("");
  return `<!--amazon-picks--><section aria-label="Shopping suggestions" style="margin:2.5rem 0 0;padding:1.25rem;border:1px dashed var(--line,#ccc);border-radius:16px"><p class="note-kicker">SHOPPING · AMAZON</p><h2 style="margin-top:.25rem">Supplies from this guide</h2><ul style="list-style:none;padding:0;margin:1rem 0 0;display:grid;gap:.6rem">${li}</ul><p style="margin-top:.9rem;font-size:.8rem;color:var(--muted,#666)">As an Amazon Associate we earn from qualifying purchases. Suggestions never change our guidance.</p></section><!--/amazon-picks-->`;
}
const adsHead = () => `<!--adsense--><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ADS)}" crossorigin="anonymous"></script><!--/adsense-->`;
function privacyBlock() {
  const parts = [];
  if (TAG) parts.push(`<h2>Affiliate links</h2><p>Some guides link to Amazon. As an Amazon Associate we earn from qualifying purchases. If you follow one of these links, Amazon may set cookies to attribute the purchase; its own privacy notice applies on its site. Links never change our guidance.</p>`);
  if (ADS) parts.push(`<h2>Advertising</h2><p>We show ads served by Google. Google and its partners may use cookies or similar technologies to serve and measure ads, subject to your consent where required. You can manage ad personalisation at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ad Settings</a>. See <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">how Google uses data from partner sites</a>.</p>`);
  return parts.length ? `<!--monetize-privacy--><section>${parts.join("")}</section><!--/monetize-privacy-->` : "";
}

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : []; });
let changed = 0, guides = 0;
for (const file of walk("public")) {
  const before = readFileSync(file, "utf8");
  let html = strip(strip(strip(before, "amazon-picks"), "adsense"), "monetize-privacy");
  if (ADS) html = html.replace("</head>", `${adsHead()}</head>`);
  if (TAG && file.replaceAll(String.fromCharCode(92), "/").endsWith("public/home.html") && html.includes("</main>")) {
    // Wrapper class lives inside the markers so re-runs strip it cleanly (idempotent).
    html = html.replace("</main>", `${amazonBlock(HOME_PICKS).replace("Supplies from this guide", "A starter stain kit").replace('<section aria-label="Shopping suggestions" style="margin:2.5rem 0 0;', '<section class="wrap" aria-label="Shopping suggestions" style="margin:2.5rem auto 3rem;')}</main>`);
  }
  if (TAG && /data-page="guide"/.test(html)) { const p = picksFor(html); if (p.length) { html = html.replace("</article>", `${amazonBlock(p)}</article>`); guides++; } }
  if (file.replaceAll(String.fromCharCode(92), "/").endsWith("public/privacy/index.html")) { const b = privacyBlock(); if (b) html = html.includes("</article>") ? html.replace("</article>", `${b}</article>`) : html.replace("</main>", `${b}</main>`); }
  if (html !== before) { writeFileSync(file, html); changed++; }
}
const adsTxt = join("public", "ads.txt");
if (ADS) writeFileSync(adsTxt, `google.com, ${ADS.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
else if (existsSync(adsTxt)) unlinkSync(adsTxt);
console.log(`amazon=${TAG ? "on" : "off"} ads=${ADS ? "on" : "off"} files changed=${changed} guides with picks=${guides}`);
