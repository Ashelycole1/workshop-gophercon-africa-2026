# DESIGN.md — "Karibu Safari" (GopherCon Africa 2026)

Single source of truth for look, feel, motion, and interaction. Read this before touching any template, CSS, or JS. When in doubt, choose the more memorable option, but never break `make web`.

---

## 1. Concept

**A living safari powered by real sighting data.** The visitor arrives at golden hour on the savanna. Animals from the dataset peek out of the grass. A Kente-capped Go gopher welcomes them to GopherCon Africa and guides the tour.

**Feeling:** warm, awe-inspired, playful, proud. Premium nature-documentary meets festival poster.

**One-line pitch for judges:** *"Open data, turned into a place you want to visit."*

---

## 2. Mascot: The Gopher Guide

- Asset: `assets/gopher.jpg` (cyan Go gopher, Kente cap, round glasses, Africa pendant, green/red scarf). If missing, draw a simple inline SVG fallback.
- Role: host, tour guide, easter egg.
- Entrance: slides up from bottom-right grass with a small bounce (400–600ms, `cubic-bezier(.34,1.56,.64,1)`), then shows a speech bubble:
  > **"Karibu! Welcome to GopherCon Africa 🌍"**
  > [Start the safari] [Maybe later]
- Persistence: remember dismissal in `localStorage` (`gopher_seen=1`). After dismissal he shrinks to a small floating avatar bottom-right; clicking reopens the bubble.
- Context tips (short, max 90 chars, one at a time): on an animal page ("Psst, this one was spotted in Kajiado!"), on stats ("Buffalo are winning today!"), on map ("Drag around, there are animals everywhere.").
- Easter eggs: click 5 times for confetti and a Go joke; Konami code switches the site to night safari.
- Bubble style: cream background, 2px dark-brown border, 16px radius, Kente-pattern bottom border, tail pointing at the gopher.
- Never block content: the bubble must be dismissible by click, Esc, or clicking outside.

---

## 3. Colour Tokens

Define as CSS custom properties in one file (`:root`), no hardcoded hex elsewhere.

```css
:root {
  /* Savanna */
  --sand-50:  #FBF4E6;   /* page background */
  --sand-100: #F3E6C8;
  --sand-300: #E2C98F;
  --earth-600:#8A5A2B;
  --earth-900:#2B1B0E;   /* primary text */

  /* Greens */
  --acacia-500:#4F7A3A;
  --acacia-700:#2F4F24;
  --acacia-900:#1B2E16;

  /* Sunset */
  --sun-400:  #F5A524;
  --sun-600:  #E26D1F;
  --ember-600:#B8321F;

  /* Kente accents (from the gopher's cap) */
  --kente-green:#1E7A3A;
  --kente-red:  #C0391B;
  --kente-gold: #F2B312;
  --kente-black:#1A1208;

  /* Gopher cyan, use sparingly as a highlight */
  --gopher:   #6AD4E8;

  /* Night mode */
  --night-900:#0B1220;
  --night-700:#16223A;
  --moon:     #F4EBC1;
}
```

**Usage rules**
- Light mode: `--sand-50` background, `--earth-900` text.
- Primary actions: `--sun-600` fill, `--earth-900` text, `--sun-400` hover.
- Links and accents: `--acacia-700`; focus ring: `--gopher` 3px.
- Gopher cyan is for the mascot and tiny highlights only.
- Contrast: body text must pass WCAG AA (4.5:1). Verify the sunset-on-sand combos.

---

## 4. Typography

- Display (headings, hero): a characterful serif or slab with warmth, e.g. **Fraunces** or **DM Serif Display**. Weight 700–900.
- Body/UI: clean humanist sans, e.g. **Inter** or **Nunito Sans**. Weight 400/600.
- Scientific names: display italic, `--earth-600`.
- Load via local `@font-face` (vendored in `static/fonts`) with `font-display: swap`. Always add system fallbacks. Conference wifi can be bad.

| Token | Size | Use |
|---|---|---|
| `--text-hero` | `clamp(2.75rem, 7vw, 6rem)` | Landing headline |
| `--text-h1` | `clamp(2rem, 4vw, 3.25rem)` | Page titles |
| `--text-h2` | `1.75rem` | Section titles |
| `--text-body`| `1.0625rem` / 1.65 | Paragraphs |
| `--text-small`| `.875rem` | Credits, captions |

---

## 5. Kente Pattern Language

Kente is the visual signature, taken from the gopher's cap. Use it as **accent**, never as full background.

- Divider strip: 8–12px repeating stripe (`--kente-green`, `--kente-gold`, `--kente-red`, `--kente-black`) via `repeating-linear-gradient` or a small SVG tile.
- Uses: header bottom border, card top edge, speech-bubble border, footer, section dividers, loading bar.
- Keep it to one strip per section at most.

---

## 6. Layout and Spacing

- 8px spacing scale: `4, 8, 16, 24, 32, 48, 72, 112`.
- Content max width `1200px`; reading width `68ch`.
- Mobile-first. Breakpoints: `640 / 900 / 1200`.
- Cards: 20px radius, soft layered shadow (`0 2px 4px rgba(43,27,14,.08), 0 12px 32px rgba(43,27,14,.12)`), 1px `--sand-300` border.
- Sticky header, translucent sand with backdrop blur, with logo (gopher head), nav (Safari, Map, Animals, Countries, Gallery, Stats, Migrations), and a day/night toggle.

---

## 7. Landing Page ("The Savanna")

Full-viewport scene built in layered SVG/CSS, back to front:

1. **Sky:** gradient (dawn peach to sunset orange to dusk purple), shifts with scroll or the day/night toggle.
2. **Sun/Moon:** large soft disc, slow drift.
3. **Far hills:** low-contrast silhouettes (parallax 0.1×).
4. **Acacia trees:** dark flat-top silhouettes (0.3×).
5. **Herd silhouettes** walking across the horizon (slow loop, 60–90s).
6. **Mid grass:** swaying animation (CSS `transform: skewX`, 4–6s, staggered).
7. **Foreground grass + animals:** real sightings poke up from the grass.

**Animal pop-ups**
- 6–8 animals from the dataset placed at random grass positions (seeded by build, not per-load).
- On hover/tap: animal rises 30–60px with a tiny bounce, and a name tag appears ("African buffalo · Nairobi").
- On click: navigate to the sighting page.
- Idle: an occasional random animal peeks out and ducks back (every 6–10s).
- Parallax via pointer position on desktop, and device tilt or scroll on mobile.

**Hero copy:** "Karibu. 50 sightings. One continent." with CTAs: **Start the safari** (scrolls/links to map) and **Browse animals**.

Below the fold: featured sighting, stats teaser, "Today's best spot", and the gallery strip.

---

## 8. Components

**Sighting card:** photo (4:3, rounded, subtle zoom on hover), species name (display font), italic scientific name, meta row (📅 date · 📍 location · 👤 recorder), weather chip, Kente top edge. Tilt-on-hover (max 6°).

**Weather chip:** icon + temp + one-word condition. Colour-coded by condition. Add a "Safari-ready?" verdict tooltip.

**Filter chips:** pill buttons, multi-select, with active state `--acacia-700` background and cream text. Live count: "Showing 12 of 50".

**Map popup:** photo thumbnail, name, date, "View sighting →".

**Stat tile:** big count-up number (display font), small label, Kente underline.

**Buttons:** 999px radius, 48px min height (touch-friendly), clear `:focus-visible` ring.

**Lightbox:** dark overlay, arrow keys and Esc, swipe on mobile, shows credit and caption.

---

## 9. Pages and Information Architecture

| Route | Content |
|---|---|
| `/` | Savanna landing, gopher welcome |
| `/map/` | Interactive sightings map with filters |
| `/animals/` and `/animals/<slug>/` | Species index; per-species page with mini-map and fun fact |
| `/countries/` and `/countries/<slug>/` | Country index; per-country page |
| `/sightings/<id>/` | Single sighting: big photo, weather, location, nearby sightings |
| `/gallery/` | Masonry gallery and lightbox |
| `/stats/` | Dashboard |
| `/migrations/` | Animated migration routes and Safari Planner |
| `/404.html` | Gopher lost in the savanna |

All generated at build time from the data. Clean slugs, breadcrumbs, prev/next on detail pages.

---

## 10. Motion Principles

- Purpose over decoration: motion shows hierarchy, reveals, or delights.
- Durations: micro 150–200ms, UI 250–400ms, scenic 4–90s loops.
- Easing: `cubic-bezier(.2,.8,.2,1)` for UI, springy `cubic-bezier(.34,1.56,.64,1)` for pop-ups.
- Scroll reveals: fade and rise 16px, staggered by 60ms.
- Only animate `transform` and `opacity`. No layout thrash.
- **Respect `prefers-reduced-motion`:** disable parallax, loops, and tilt, and show static scenes.

---

## 11. 3D and Special Effects

Keep one hero 3D moment, done well:

- **Option A (preferred, lightweight):** CSS 3D tilt cards and a layered parallax scene.
- **Option B:** a small vendored Three.js globe or Africa model with sighting pins. Clicking a pin flies the camera to that location and opens its card. Fall back to the 2D map if WebGL is unavailable.
- Cap the 3D canvas at 60fps, pause when offscreen (`IntersectionObserver`), and lazy-load.

---

## 12. Map Style

- Tiles: a soft, muted style that matches the sand palette (vendor tiles, or use a hand-built SVG Africa map if offline reliability is the priority).
- Markers: custom animal-emoji pins in a rounded sand badge with an acacia border.
- Clustering at low zoom, with the cluster count in a Kente-bordered circle.
- Selected marker bounces once and opens its popup.

---

## 13. Migration Trails

- Clearly labelled **"Illustrative routes"** (not real tracking data).
- Animated dashed polylines (`stroke-dashoffset` animation) in `--sun-600`, with a moving dot.
- Time slider (Jan–Dec) showing the herd position per month, with a short caption per month.
- Example routes: Serengeti–Mara wildebeest loop, an elephant corridor, a flamingo Rift Valley lake hop.

---

## 14. Data Visualisation

- Charts in SVG, with palette order: `--acacia-500`, `--sun-600`, `--kente-gold`, `--ember-600`, `--gopher`.
- Direct labels over legends where possible.
- Count-up on first view; bars grow from zero (600ms).
- Always include a text/table fallback for accessibility.

---

## 15. Night Safari Mode

- Toggle in the header, plus the Konami code. Respect `prefers-color-scheme` as the default.
- Sky to `--night-900`, with stars and moon; fireflies drift (small glowing dots, `opacity` pulse).
- Cards switch to `--night-700` with a `--moon` text accent.
- Kente accents stay vivid in both modes.

---

## 16. Accessibility Checklist (non-negotiable)

- [ ] All images have meaningful `alt` text (species and place).
- [ ] Full keyboard navigation, visible focus rings, logical tab order.
- [ ] Gopher bubble, lightbox, and map popups are focus-trapped and Esc-closable.
- [ ] Colour contrast AA minimum.
- [ ] `prefers-reduced-motion` honoured everywhere.
- [ ] Map and charts have text alternatives.
- [ ] Touch targets at least 44px.
- [ ] Semantic landmarks (`header`, `nav`, `main`, `footer`).

---

## 17. Performance and Reliability

- `make web` must always pass. Run it after every feature.
- Zero required API keys. Cache any fetched data (e.g. weather) into the repo at build time with a graceful fallback.
- Vendor JS/CSS/fonts locally. No hard dependency on a CDN.
- Images: `loading="lazy"`, explicit width/height, responsive `srcset` if the pipeline supports it.
- JS budget: small and deferred. No framework needed.
- No console errors and no broken links.

---

## 18. Copy and Voice

- Warm, welcoming, a little playful, with light Swahili touches (*Karibu*, *Safari njema*, *Asante*). Never forced.
- Short sentences. Active voice.
- Credit people ("Spotted by Rebeka") because the community made this data.
- Examples: "Karibu, friend." · "Safari njema!" · "Nothing here but grass... or is there?"

---

## 19. Definition of Done

1. `make web` passes with no errors or warnings.
2. Gopher welcome, savanna landing, map, an animal page, a sighting page, stats, and gallery all work on desktop and mobile.
3. Every route in section 9 resolves.
4. Reduced-motion and night modes verified.
5. README has a concept summary and "Why this should win".
6. Committed, then `make push` completed before the deadline.

## 20. Priority if Time Runs Short

1. Savanna landing and gopher welcome (the wow)
2. Sightings map
3. Per-animal and per-sighting pages
4. Weather on sightings
5. Stats, gallery
6. Migrations, 3D, easter eggs

Ship a polished subset rather than a sprawling unfinished whole.
