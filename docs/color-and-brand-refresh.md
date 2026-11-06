# Color and brand refresh

## Current storefront design

The storefront now uses warm cream, a contrasting lilac hero, coral accents, butter yellow, and mint. Rounded Nunito text pairs with a complete self-hosted Caveat font for short handwritten notes. A compact header, filterable bookshelf, portrait film section, interactive crew, dark plum sketchbook gallery, free activity, FAQ, and lavender footer form the page.

The main artwork is custom SVG: `hero-scene.svg`, the three `cover-*.svg` files, `crew-lineup.svg` and its matching outline version, `farewell.svg`, and a path-based `moon-mesh-wordmark.svg`. These use simple faces, asymmetrical paths, rounded pen outlines, and flat fills. They do not use generated raster images. The older raster artwork remains available in the repository; the existing traced coloring activity and printable are retained.

The owner-supplied video is included as a complete 720 × 1280 H.264/AAC clip, 16.4 seconds long, with a local WebP poster. The player keeps its portrait proportions and supports native controls without autoplay. It starts muted, defers loading until requested, and pauses when the tab becomes hidden.

The notes below document earlier versions and their asset provenance.

## Earlier brand refresh

The header and footer now use the two complete logo lockups provided by the owner. They are encoded as WebP without redrawing the artwork or retypesetting the name. The white and lavender backgrounds match their respective placements.

The three colored preview SVGs are produced from the exact contours of their outline counterparts. `npm run build` runs `scripts/color-previews.mjs` before compiling Tailwind. All ink paths are preserved on top of the flat fills. The activity pages and printable remain black-and-white.

The crew itself is a native button with an accessible name and pressed state. Both image layers occupy the same space, with a short opacity transition that respects the site's reduced-motion rule. The separate color button is removed.

## Validation

- Tailwind production build, JavaScript syntax check, and `git diff --check` pass.
- Compared all three colored SVGs against their sources: the final ink paths remain byte-for-byte identical.
- Browser checks confirm the crew changes with click, Enter, and Space; all three previews open their colored counterparts and update their thumbnails.
- Checked 320 px and 390 px phone layouts. The compact header fits without horizontal overflow; direct image interaction works at phone width.
- The preview-to-studio action still opens the free page with all 25 colorable shapes.
- Header, footer, and illustration assets load correctly in the managed preview.

## Footer artwork

- Final website asset: `assets/see-you-on-the-moon.webp` (1400 × 477, with alpha).
- Method: built-in image generation; the existing approved crew illustration supplies character and style reference.
- Character reference: `assets/our-little-crew.webp`.
- This is digitally generated illustration with a hand-drawn aesthetic, not a claim of human hand authorship.

Prompt used:

> Use case: illustration-story. Asset type: original Moon Mesh website footer illustration. Input image 1 is a character/style reference, not an edit target. Draw a NEW cozy scene featuring these exact four original friends: Miso the grounded cream kitten with small dot eyes, tiny w mouth and mustard yellow scarf; Plum the lilac lop-ear rabbit; Pip the small butter-yellow star; Sprout the tiny beige snail with sage-green spiral shell. Miso and Plum sit close together behind a low lavender table edge, waving goodbye with one paw, with an open coloring book between them and a red, green, yellow crayon beside Pip; Sprout rests beside the book. One simple crescent moon and two tiny stars above. Composition: wide horizontal group, characters have substantial large simple silhouettes, concentrated along the bottom, no other scenery, no lettering. Hand inked imperfect black felt-tip outlines with slightly varied line width, organic rounded curves, flat warm cream, lilac, sunny yellow, coral red and leaf green fills, quiet warm expressions, a trace of paper-like printed texture inside the characters only. Keep faces and limbs simple and structurally sound. No shiny large eyes, no 3D, no gradients, no vector geometric perfection. Genuine transparent background and ample clear space around the full group; no cropping of paws or characters.
