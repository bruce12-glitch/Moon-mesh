# Frontend refinements — 9 November 2026

This pass follows the supplied screenshots and screen recording and the public [Coco Wyo homepage](https://cocowyo.com/). It preserves Moon Mesh's content, section order, Fraunces/Nunito typography, cream and lavender surfaces, yellow accents, and existing character artwork.

## Reference findings

Rendered inspection at 1440 × 1000 and 390 × 844 found Coco Wyo's paired character images crossfading on hover with a 400 ms opacity transition. The complete strip scales down on mobile. Its coloring video plays silently inline, loops, and uses `playsinline`. The inspected book images stayed still on hover; Moon Mesh's requested small pointer tilt is an additional treatment, not an effect copied from that reference. No third-party artwork, fonts, or video were imported.

## Applied changes

- The hero uses the complete illustration with `contain` on desktop, without the rounded clipping container. Mobile removes only the source image's empty left margin; the window, characters, table legs, and cushions remain visible. The FAQ and book-cover illustrations also retain their complete frames.
- Crew drawings reveal their matching colors on mouse/pen entry and keyboard focus, and return to outlines on exit. Touch users retain tap-to-color. Page previews crossfade between the exact outline and colored SVGs on hover/focus; opening a preview no longer permanently replaces its thumbnail.
- Book covers lift slightly and tilt by at most 3° vertically and 4° horizontally in response to a fine pointer. Leaving resets the tilt. Reduced-motion preferences disable this spatial effect.
- The original 16.4-second coloring video appears in a portrait frame and loops muted when visible. It pauses outside the viewport, in a hidden tab, while its full player is open, or when the visitor presses Pause. Scrolling back resumes it without resetting. Reduced-motion visitors choose playback themselves. The portrait poster is a still extracted from the supplied clip.
- The yellow scalloped trim is beneath the complete farewell illustration, transitioning into the lavender footer.

The existing Miso, Plum, Pip, and Sprout artwork and paired color/outline assets remain the visual source of truth. No new characters or illustration style were introduced.
