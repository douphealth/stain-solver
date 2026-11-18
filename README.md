# Stain Solver

[Open Stain Solver](https://stainsolver.shop/) · [Browse the guides](https://stainsolver.shop/guides/) · [Open the solver](https://stainsolver.shop/solve/)

Stain Solver helps readers choose a first move for a spill, check fabric and care-label restrictions, and follow a tailored plan. Readers can share a link or save plans on their device. The guide finder supports both everyday terms such as “couch” and material names such as “denim”.

## Develop

```sh
git clone https://github.com/douphealth/stain-solver.git
cd stain-solver
bun install --frozen-lockfile
bun run dev
```

Run `bun run test` for the test suite and `bun run build` for the production build. The project also supports the [Lovable editor](https://lovable.dev/projects/fae81829-2f93-4b94-936a-4e1ded031f2c).

## Where to make changes

| Area | Source |
| --- | --- |
| Homepage and solver | `public/home.html`, `public/solve/index.html`, `public/assets/js/app.js` |
| Rule engine and source data | `public/assets/js/engine.js`, `public/assets/js/data.js` |
| Saved and shared plan fields | `public/assets/js/plan-state.js` |
| Guide directory and articles | `public/guides/` |
| Guide filters and interactive checklists | `public/assets/js/guide-reader.js` |
| Responsive fieldbook styling | `public/assets/css/fieldbook.css` |
| Public routing and offline cache | `src/server.ts`, `public/sw.js` |

## Publishing guide changes

Keep published paths and canonical URLs stable. Article answers, source links and guide cards are present in the initial HTML. The guide directory lists each published article in its structured data. When a guide changes, update its sitemap modification date. The personalized solver is intentionally excluded from the sitemap. Update the service worker cache version with asset changes.

Before release, try the guide finder on a narrow screen, follow a guide with JavaScript disabled, and reopen a shared plan with a previously tried cleaner. Roll back a release by reverting its commit in Git and redeploying through the existing production pipeline.
