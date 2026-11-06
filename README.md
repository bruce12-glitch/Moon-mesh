# Moon Mesh

Moon Mesh is a children's coloring-book storefront featuring Miso the kitten. The site includes a themed bookshelf, Amazon discovery links, book previews, a free coloring activity, and a printable PDF.

## Run locally

From the repository root:

```sh
npm ci
npm run build
python3 -m http.server 8000
```

Visit [localhost:8000](http://localhost:8000/). The coloring studio reads a same-origin SVG, so use the local server to test it. The site uses plain HTML, CSS, and JavaScript and can be served by any static host.

## Frontend system

Custom Tailwind components live in `src/styles.css`; `npm run build` compiles them to the shipped `styles.css`. Self-hosted Nunito handles interface text, Fraunces the hero and coloring-table headlines, and Caveat short handwritten notes. The coloring studio uses editable SVG shapes and the Canvas API for PNG downloads.

The coloring-table section uses the supplied 16.4-second clip, optimized to a 720 × 1280 H.264/AAC MP4 (about 3 MB) with fast-start metadata. Its landscape poster opens a native-controls dialog that preserves the full portrait video. The video loads on interaction, pauses when the dialog closes, and has a direct-file fallback without JavaScript. Keep `assets/coloring-table.mp4` and `assets/coloring-table-poster.webp` with the static site when deploying.

The three cover designs share a common series layout. Amazon links currently open a Moon Mesh book search. Replace them with verified storefront or product URLs when those are supplied. Moon Mail is explicitly marked as a form preview and does not send or store email.

See [the design audit](docs/design-audit.md) for the Coco Wyo reference findings, the Moon Mesh palette, and the illustration inventory.
