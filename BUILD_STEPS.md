# BUILD_STEPS.md: Karibu Safari, step by step

Feed Claude Code **one step at a time**. Wait for it to finish, check the result in the browser, then move on. Every step ends with `make web` passing and a git commit. Always follow `DESIGN.md`.

**Rule for every step:** run `make web` at the end. If it fails, fix it before doing anything else.

---

## Step 0: Discover (5 min)

```
Read DESIGN.md. Then read the README, Makefile, go.mod and the full directory tree.
Work out how `make web` builds the site (templates, data loading, output dir, assets).
Inspect the sightings data: fields, counts, countries, species, coordinates, image URLs.
Run `make web` to confirm the baseline builds.
Report back in 10 lines max. Do not change any code yet.
```

**Check:** you understand where templates, data, and static files live.

---

## Step 1: Foundation: design tokens, layout, header/footer (15 min)

```
Implement the design foundation from DESIGN.md:
- CSS custom properties (colours, type scale, spacing) in one stylesheet.
- Vendored fonts with fallbacks, no CDN dependency.
- Base layout: sticky translucent header with nav, footer, Kente divider strip.
- Restyle the existing sightings list page and its cards (photo, species, scientific name, meta row).
- Add assets/gopher.jpg as the header logo. It is a JPG with a white background, so use a rounded frame or mix-blend-mode so it blends in.
Run `make web`, then commit: "foundation: design system and layout".
```

**Check:** the existing page looks warm and branded, not default.

---

## Step 2: The Gopher welcome (15 min)

```
Add the Gopher Guide from DESIGN.md section 2:
- Slides up bottom-right on first visit with a bounce.
- Speech bubble: "Karibu! Welcome to GopherCon Africa 🌍" with [Start the safari] and [Maybe later].
- Dismissible by click, Esc, or outside click; remember in localStorage.
- Shrinks to a floating avatar that reopens the bubble.
- Respect prefers-reduced-motion.
Run `make web`, then commit: "feat: gopher welcome".
```

**Check:** the gopher pops up, the bubble closes, and a reload doesn't repeat it.

---

## Step 3: Savanna landing page (30 min), the wow

```
Build the landing page from DESIGN.md section 7:
- Layered SVG/CSS scene: sky gradient, sun, hills, acacia silhouettes, swaying grass.
- 6-8 real animals from the dataset peeking from the grass; hover/tap raises them and shows a name tag; click goes to the sighting.
- Random idle peek-and-duck every 6-10s.
- Pointer parallax on desktop, scroll parallax on mobile.
- Hero copy "Karibu. 50 sightings. One continent." with two CTAs.
- Move the existing sightings list to /sightings/ and link it from the nav.
Run `make web`, then commit: "feat: savanna landing".
```

**Check:** this is your demo moment. Make it feel great before moving on.

---

## Step 4: Per-sighting, animal and country pages (25 min)

```
Generate static pages at build time with clean slugs:
- /sightings/<id>/, /animals/ and /animals/<slug>/, /countries/ and /countries/<slug>/.
- Breadcrumbs, prev/next, related sightings.
- Make every sighting card on the site link to its page.
- Gopher shows a context tip on animal pages.
Verify every internal link resolves. Run `make web`, then commit: "feat: detail pages".
```

---

## Step 5: Interactive map (25 min)

```
Add /map/ with all sightings plotted (vendor Leaflet locally, or a hand-built SVG Africa map).
Custom animal-emoji markers, clustering, popups with photo/name/date/"View sighting".
Filters by species, country and date range that update the map live, with a "Showing X of 50" count.
If the data has no coordinates, geocode by place name at build time and cache the result in the repo.
Run `make web`, then commit: "feat: sightings map".
```

---

## Step 6: Weather on each sighting (15 min)

```
Add weather to every sighting and sighting card:
- Fetch from Open-Meteo at build time, cache results in the repo so offline builds never fail.
- Show a chip: icon, temperature, one-word condition, plus a "Safari-ready?" verdict.
- If the fetch fails, fall back to cached data or hide the chip. Never fail the build.
Run `make web`, then commit: "feat: weather".
```

---

## Step 7: Stats dashboard and gallery (25 min)

```
Add /stats/: top species, sightings per country, sightings over time, top spotters leaderboard, count-up numbers, "Rarest sighting" and "Most spotted animal" highlights. Charts in SVG with a text fallback.
Add /gallery/: masonry grid, lightbox with keyboard and swipe, lazy loading, filter chips, credits.
Run `make web`, then commit: "feat: stats and gallery".
```

---

## Step 8: Push checkpoint (5 min)

```
Run `make web`, open the output and test: landing, a sighting page, map, stats, gallery, on desktop and mobile widths.
Fix anything broken, then run `make push`.
```

**Check:** you now have a complete, submittable site. Everything after this is bonus.

---

## Step 9: Migrations and 3D (30 min)

```
Add /migrations/: clearly labelled "Illustrative routes", animated dashed paths with a moving dot, a Jan-Dec time slider with captions (Serengeti-Mara wildebeest, an elephant corridor, a flamingo Rift Valley hop).
Add one hero 3D moment: CSS 3D tilt cards, or a small vendored Three.js globe with sighting pins (fall back to 2D if WebGL fails).
Pause offscreen animation. Run `make web`, then commit: "feat: migrations and 3D".
```

---

## Step 10: Delight and polish (20 min)

```
Add night safari mode (toggle plus Konami code, stars, fireflies), gopher easter eggs (5 clicks gives confetti and a Go joke), custom 404 with the gopher lost in the savanna, and the "Spot the Gopher" hidden mini-game if time allows.
Run the accessibility checklist in DESIGN.md section 16 and fix gaps.
Run `make web`, then commit: "feat: delight and polish".
```

---

## Step 11: Final (before the deadline)

```
1. Run `make web` and confirm a clean build.
2. Check for console errors and broken links or images.
3. Add a README section: concept, features, how to run, and a "Why this should win" paragraph.
4. Commit and run `make push`.
5. Give me a 60-second demo script for the judges.
```

---

## If time runs short

Stop after **Step 8** and spend the remaining time on Step 3 polish. A beautiful landing page with the gopher, map and detail pages beats a sprawling unfinished site. Push after every step so something judgeable is always online.
