# Karibu Safari: design

The look follows the Tazama reference (gophercondemo.gritframework.dev): white pages,
deep forest green, lime buttons, clean lettering with one handwritten word per headline.
The Go gopher guide, the 3D Africa map and the grass peekers stay as our own extras.

## Colours (`web/assets/css/app.css`, `:root`)

| Token | Day | Night | Use |
|---|---|---|---|
| `--forest` | `#1f4d3a` | `#9fd18a` | headings accents, active nav, footer band |
| `--moss` | `#4e7d3a` | `#8cc276` | the handwritten word, links on hover, focus ring |
| `--lime` | `#d4f06a` | same | main buttons, pins, stickers, highlights |
| `--ink` | `#15201a` | `#ecf2ec` | text |
| `--paper` | `#ffffff` | `#0d1411` | page |
| `--mist` / `--surface` / `--surface-2` | `#f7f9f5` / `#f1f5ef` / `#e2eadf` | `#111a16` / `#16211b` / `#213029` | panels, filter bar, empty map land |
| `--muted` | `#56655b` | `#9baca1` | secondary text |
| `--line` | `#e1e8de` | `#24322a` | borders |

The old names (`--sand-*`, `--earth-*`, `--kente-*`, `--sun-*`) are kept as aliases of these
so the other pages follow. Use the new names in new code. Lime is never used for text on white.

## Lettering

- Geist (`assets/fonts/geist-latin-wght.woff2`), weight 500 body, 600 headings, tight
  letter-spacing (-0.035em) on headings.
- Kalam 700 (`assets/fonts/kalam-latin-700.woff2`) for one word per headline:
  `<em class="script">close.</em>`. Also the footer greeting and the "Today's pick" sticker.

## Shapes

- Pill buttons (999px). Main button: lime with a dark round arrow (`.btn__arrow`) that turns
  on hover. Secondary: `.btn--forest`, or `.btn--ghost` with a thin line.
- Cards and panels: 22px radius, 1px line, soft long shadow. No Kente strips.
- Footer: forest band with rounded top corners.

## Home page, top to bottom

1. Banner: badge, headline, lede, two buttons, four counting stats; the 3D Africa map on the right.
2. Photo strip: the five newest photos of different animals; one opens wide, others fold, cycles
   every 5s until touched. On a phone it's a swipe row with dots.
3. Today's best spot.
4. Latest sightings (`#sightings`): search, animal, country, from/until, order, clear; quick animal
   chips; 24 at a time with "Show more"; "Surprise me"; filters saved in the address bar.
   Without JavaScript every sighting is shown and the filters stay hidden.
5. Who's in the grass (peekers, green grass).
6. Pick a country chips.

## Avoid

- The old sunset/sand palette and Fraunces/Nunito.
- A country face-off (the user didn't want one).
