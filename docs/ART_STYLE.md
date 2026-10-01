# Oasis Derby — art style guide

Oasis Derby is a browser version of a camel-racing betting board game, set at a
desert oasis in **1920s Egypt** (the golden age of Egyptology: pyramids, bazaars,
fezzes, pith helmets, parasols, Nile palms). The mood is **cute, warm, storybook**.

All art is hand-written **inline SVG returned as strings from ES module functions**
(no image files). Art must look great from 32 px (avatar chips) up to 300 px.

## Look & feel

- **Sticker style**: flat fills, chunky rounded shapes, big friendly heads.
- **Outline**: dark warm brown `#3b2412`, `stroke-linejoin="round"`,
  `stroke-linecap="round"`. Width **2.5** in a 100-unit viewBox (scale
  proportionally for bigger viewBoxes). Scenery that sits far away uses **no
  outline** (atmospheric perspective: lighter, less saturated).
- **Shading**: one flat shadow tone (a darker, slightly warmer version of the base)
  and at most one small highlight. No photographic gradients on characters.
  Gentle gradients are OK for sky, water, and sand.
- **Faces**: dark oval eyes `#2a1a10` with one tiny white highlight dot, OR happy
  closed "^" arcs. Small smile. Rosy cheek blush: ellipse `#f28b82`, opacity 0.55.
- **Skin tones** (use a varied, respectful mix): `#f6d3b0`, `#e8b48a`, `#cf9366`,
  `#a86d45`, `#7a4a2c`. Shadow tone = ~12% darker.
- Never use cacti (wrong continent). Use date palms, papyrus, reeds, lotus, desert
  shrubs, rocks.

## Palette (taken from the printed rulebook)

| Role | Hex |
| --- | --- |
| Parchment light / mid / deep | `#fff3d4` `#ffe9a6` `#f9ca74` |
| Sand / dune | `#f7d58c` `#efae64` `#e59e60` |
| Terracotta (track stripe) | `#d05631` `#bb613d` |
| Crimson (headings) | `#8e1a1a`, outline `#520a0a` |
| Teal (logo) | `#2ec4c6` `#1a9aa3` `#80dad1` |
| Gold | `#f2b84b` `#d99a1e` `#fbe08a` |
| Ink / outline brown | `#3b2412` |
| Water | `#3fb7c9` `#8fe0e6` `#1f8ea3` |
| Palm green | `#4f9a3a` `#78bf4c` `#2f6b2a` |

### The five racing camel colours (+ two crazy camels)

These colours are the heart of the game and appear everywhere (awnings, flags,
bunting, rugs in the scenery are encouraged to use them).

| Camel | Base | Light | Dark |
| --- | --- | --- | --- |
| blue | `#1a9fd6` | `#7fd0f0` | `#0b6e9c` |
| yellow | `#f5cf2f` | `#fde88f` | `#c89b0c` |
| green | `#2a9a45` | `#74cf82` | `#17672c` |
| red | `#e0344f` | `#f5899a` | `#a31a34` |
| purple | `#6a45a8` | `#a88ae0` | `#43287a` |
| white (crazy) | `#f6f1e7` | `#ffffff` | `#cfc5b3` |
| black (crazy) | `#2e2828` | `#524848` | `#171313` |

## Technical rules (important)

- Each function returns a complete `<svg ...>` string with `xmlns` and `viewBox`.
- Use **presentation attributes** (`fill=`, `stroke=`), not `<style>` blocks or CSS
  classes, and no CSS variables (themes are passed in as arguments instead).
- No `<text>` elements (fonts are not guaranteed), no external references, no
  `<image>`, no filters.
- Allowed: `path`, `circle`, `ellipse`, `rect`, `polygon`, `polyline`, `line`, `g`,
  `defs`, `linearGradient`, `radialGradient`, `clipPath`, `use`, `transform`,
  `opacity`.
- **IDs must be unique per call**: if you use `<defs>` ids (gradients, clip paths),
  suffix them with a random or counter-based token so several copies of the same
  SVG can live on one page without clashing.
- Keep path data compact (1 decimal place is plenty).
- Export plain functions; no DOM access at import time (modules are also imported
  in Node for previews/tests).

## Previewing your work

1. Start the dev server once (background): `node tools/dev-server.mjs` → serves the
   project at `http://localhost:5317`.
2. Make a gallery page in `tools/` that imports your module and draws the SVGs.
3. Screenshot it: `node tools/snap.mjs "http://localhost:5317/tools/<page>.html" <out.png> 1200 900`
   and look at the PNG with the Read tool. Iterate until it's delightful.
