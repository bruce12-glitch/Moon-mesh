# Moon Mesh storefront and reference audit

## Implementation baseline

Future interface work follows an Aki-style custom Tailwind component system. Use Shadcn UI primitives for accessible, composable controls such as dialogs, buttons, tabs, and menus. Use the Canvas API or React-Canvas-Draw for interactive coloring surfaces, keeping the printable activity pages as the source of truth for line art.

Keep component tokens aligned with the Moon Mesh ink, red, green, yellow, and cream palette. New components should preserve the hand-inked visual language while keeping interaction behavior keyboard-accessible and responsive.

The reference is [Coco Wyo](https://cocowyo.com/). Moon Mesh takes its cues from how the shop uses illustrations to move a visitor from discovery to a book or activity. Its characters, words, colors, cover concepts, and coloring page were developed for Moon Mesh.

## What Coco Wyo does

| Element | Coco Wyo evidence | Moon Mesh decision |
| --- | --- | --- |
| Base and text | Rendered homepage body uses near-white `#fffefe` with `#3c3c3c` body text. The nav, section titles, and card titles sampled use `#322f37`. | Use warm paper `#fbf7ee` with plum ink `#2d2945` so the store feels like a picture book. |
| Accent colors | The saved theme declares `#9f9489` as a global background token and `#918981` for carousel dots. The first desktop banner layers earth brown, cream, pink, yellow, and green inside the artwork. The artwork colors are visual observations. | Put Moon Mesh’s strong colors where they carry meaning. A night-indigo `#28294e` hero, butter-yellow `#ffdb79` calls to action, lilac `#e7def8`, mint `#deebd8`, and peach `#f7d3c3` separate the different scenes. |
| Type hierarchy | Homepage computed styles declare Nunito. Body copy is 18 px at 400, navigation 18 px at 800, section titles 34 px at 800, collection labels 20 px at 600, and sampled product titles 18 px at 400. Hero lettering is part of the banner artwork. | Pair soft Fraunces for readable, selectable display text with Nunito for labels and copy. Keep the live hero headline fluid and make title hierarchy clear even with images disabled. |
| Header | The desktop header has a centered script wordmark, search on the left, wishlist on the right, and a separate centered nav. The measured search field is 303 × 48 px with a 25 px radius. | Put a crescent-kitten mark and a short three-link navigation in one row. Keep a visible coloring action on desktop and a compact menu on phones. |
| Campaign and introduction | The first banner fills the page width and pairs book photography, large lettering, texture, and thick-outline cartoons. Pagination dots sit below it. The welcome section repeats the character language in black-and-white art. | Use one clear illustrated hero. Carry Miso through the covers and into the line art so visitors can color a character they already met. |
| Catalog | New Release, Best Seller, and Digital each show a four-item shelf on the homepage. Product images lead, followed by short titles and prices. The collection row groups books by style and theme. | Build one launch shelf of three illustrated cover concepts. Theme names help kids pick an adventure and native dialogs give each cover a closer look. |
| Activities and reassurance | Freebies has a dedicated nav entry. The homepage also has tutorial categories, finished community artwork, FAQs, and a newsletter. | Give the free page equal billing with the books. Include a real PDF, a tap-to-fill activity, and three short FAQs for adults. |

### Layout and motion

- At the observed 1363 × 936 viewport, the reference renders an 84 px utility header and a roughly 45 px inline nav. The saved theme declares a 1440 px custom container and includes 551, 767/768, and 1024/1025 px responsive rules. The specific behavior of those rules on a touch device remains unverified.
- The reference uses full-bleed campaign art followed by progressively denser shelves. Moon Mesh uses a centered 1250 px content area with an inset cover-like hero. The shelf goes from three columns to one at 650 px, and the hero stacks copy above Miso.
- The reference exposes carousel buttons, search, a wishlist, product links, and FAQ expansion controls. Search activation timed out during the read-only inspection. Motion timings, account state, payments, and backend behavior are outside the verified scope. Moon Mesh uses short hover transitions, visible keyboard focus, reduced-motion support, and no auto-rotating hero.

### Coverage

| Source | Verified evidence |
| --- | --- |
| [Homepage](https://cocowyo.com/) | Live desktop screenshot, accessibility tree, computed samples, and public HTML text. |
| User-supplied saved homepage | Embedded styles, typography tokens, breakpoint declarations, and image/section structure. The saved copy contains styles from several sources, so only values corroborated by rendered styles or recognizable storefront selectors are used above. |
| [Bold & Easy collection](https://cocowyo.com/collections/bold-easy) | Public collection markup and catalog structure. |
| [Cozy Cafe product](https://cocowyo.com/products/cozy-cafe-coloring-book) | Public product markup. Checkout and account actions were outside the audit. |
| [Freebies](https://cocowyo.com/pages/freebies), [About Us](https://cocowyo.com/pages/about-us), and [FAQ](https://cocowyo.com/pages/faq) | Public page structure and editorial navigation. |

### Original asset inventory

| Source file | Role |
| --- | --- |
| `assets/moon-kitten.webp` | Hero. A butter-yellow crescent, a cream kitten, a coral crayon, and an open book. |
| `assets/midnight-kittens.webp` | Cover. Miso on a lavender roof with a lantern and hanging stars. |
| `assets/starlight-garden.webp` | Cover. Miso waters star-shaped flowers in a mint garden. |
| `assets/pocket-sized-planet.webp` | Cover. Miso waves from a peach-and-yellow rocket over a ringed planet. |
| `assets/moon-mark.svg` | Original crescent-and-kitten brand mark and favicon. |
| `assets/miso-and-the-moon.svg` and `assets/miso-and-the-moon.pdf` | Original line art with 14 colorable shapes and a matching one-page printable. |
| `assets/paper-grain.svg` | Decorative paper texture. |

The four WebP illustrations were generated from original scene briefs for Moon Mesh. The cover lettering is typeset in the storefront. The line art, mark, and texture are editable SVGs. The two self-hosted fonts are distributed under their included SIL Open Font License texts.

## Screenshot-led revision

| Screenshot evidence | Moon Mesh revision |
| --- | --- |
| The original Moon Mesh header shares one row between brand, navigation, and the coloring button. Coco Wyo separates the search and wishlist from its section links. | The new desktop header centers the Moon Mesh mark between search and saved books and moves section navigation to its own row. Phones get icon controls and an expandable menu. |
| The Coco Wyo introduction shows characters across a generous stretch of white, with both outline and colored examples. | Original crew artwork introduces Miso, Pip, Plum, and Sprout. A button switches the same illustration between line art and color. The hero now uses a full-width lavender field so the illustration has more room. |
| The original Moon Mesh footer is a short dark strip. Coco Wyo uses an illustrated transition into a light footer with grouped destinations. | A new illustration leads into a lilac footer with the bookshelf, coloring links, and FAQs. A small, dismissible gift shortcut leads to the free page. |
| Search and wishlist controls are prominent in the reference. | Search finds the three book concepts and key sections. Saved books are stored in the current browser. The book previews and free coloring studio still open from their own actions. |

The two new WebP illustrations use original briefs for a four-character lineup and the same crew sharing a coloring book. The outline view uses a browser filter on the lineup, so both views share one image.
