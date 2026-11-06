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

Custom Tailwind components live in `src/styles.css`; `npm run build` compiles them to the shipped `styles.css`. Nunito handles interface text, with self-hosted Caveat for handwritten accents. The wordmark and main illustrations are self-contained SVGs with flat colors and irregular pen outlines. The coloring studio uses editable SVG shapes and the Canvas API for PNG downloads.

The bookshelf includes theme filters, search, and locally saved favorites. The crew switches from line art to color on tap, and page previews reveal color on hover or keyboard focus. Motion respects the browser's reduced-motion preference.

The supplied coloring video is served locally as `assets/coloring-moment.mp4` with a WebP poster. It preserves the complete 16.4-second portrait frame, uses H.264/AAC with faststart, and loads only when requested. Playback starts muted with native controls; no autoplay is used. The optimized clip is about 3.3 MB, down from 17.1 MB.

The three cover designs share a common series layout. Amazon links currently open a Moon Mesh book search. Replace them with verified storefront or product URLs when those are supplied. Moon Mail is explicitly marked as a form preview and does not send or store email.

See [the design audit](docs/design-audit.md) for the Coco Wyo reference findings, the Moon Mesh palette, and the illustration inventory.

## Verify changes

Run `npm run build` and `npm run check`. With the local server running, `npm run test:browser` checks filters, search, saving, keyboard dialogs, coloring and PNG export, video playback, forms, assets, and responsive overflow. It requires Python Playwright (`python3 -m pip install playwright`) and either system Chromium or `python3 -m playwright install chromium`. Set `CHROMIUM_PATH` to use a specific browser, or pass a different server URL to `python3 scripts/smoke-test.py`.
