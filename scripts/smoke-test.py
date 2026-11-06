#!/usr/bin/env python3
"""Exercise the static storefront in Chromium.

Run a local server, then: python scripts/smoke-test.py [http://localhost:8000]
Requires Python Playwright and Chromium (CHROMIUM_PATH can override its path).
"""

import os
from pathlib import Path
import shutil
import sys

from playwright.sync_api import expect, sync_playwright


def run(base_url):
    errors = []
    failures = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("chromium-browser"),
            args=["--no-sandbox"],
        )
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, accept_downloads=True)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.on("response", lambda response: failures.append(f"{response.status}: {response.url}") if response.status >= 400 else None)
        page.on("requestfailed", lambda request: failures.append(f"{request.failure}: {request.url}") if request.failure != "net::ERR_ABORTED" else None)
        page.goto(base_url, wait_until="networkidle")

        # Each filter must change the real card collection and its announced state.
        for filter_id in ("midnight-kittens", "starlight-garden", "pocket-sized-planet", "all"):
            page.locator(f'[data-filter="{filter_id}"]').click()
            expected_ids = [filter_id] if filter_id != "all" else ["midnight-kittens", "starlight-garden", "pocket-sized-planet"]
            assert page.locator(".book-card:visible").evaluate_all("cards => cards.map(card => card.id)") == expected_ids
            expect(page.locator('.book-filters [aria-pressed="true"]')).to_have_count(1)
            expect(page.locator(f'[data-filter="{filter_id}"]')).to_have_attribute("aria-pressed", "true")
            expect(page.locator("#filter-status")).to_contain_text(str(len(expected_ids)))
        print("PASS adventure filters and announcements")

        # Saving survives reload; search distinguishes empty and matching results.
        heart = page.locator("#midnight-kittens .book-save")
        heart.click()
        page.reload(wait_until="networkidle")
        expect(heart).to_have_attribute("aria-pressed", "true")
        expect(page.locator(".saved-count")).to_have_text("1")
        page.locator(".saved-trigger").click()
        expect(page.locator(".catalog-result")).to_have_count(1)
        expect(page.locator(".catalog-result")).to_contain_text("Midnight Kittens")
        page.keyboard.press("Escape")
        expect(page.locator("#catalog-dialog")).not_to_be_visible()
        page.locator(".search-trigger").click()
        search = page.locator(".catalog-search input")
        search.fill("absolutely-no-such-adventure")
        expect(page.locator(".catalog-result")).to_have_count(0)
        expect(page.locator(".catalog-status")).to_contain_text("No matches")
        search.fill("pocket space")
        expect(page.locator(".catalog-result")).to_have_count(1)
        expect(page.locator(".catalog-result")).to_contain_text("Pocket-Sized Planet")
        page.locator(".catalog-result").click()
        expect(page.locator("#book-dialog")).to_be_visible()
        expect(page.locator("#preview-title")).to_have_text("Pocket-Sized Planet")
        page.keyboard.press("Escape")
        heart.click()
        page.locator(".saved-trigger").click()
        expect(page.locator(".catalog-result")).to_have_count(0)
        expect(page.locator(".catalog-status")).to_contain_text("Tap a heart")
        page.keyboard.press("Escape")
        print("PASS saved shelf persistence, catalog search, empty states")

        for card_id in ("midnight-kittens", "starlight-garden", "pocket-sized-planet"):
            card = page.locator(f"#{card_id}")
            title = card.locator("h3").inner_text()
            card.locator("[data-preview]").first.click()
            expect(page.locator("#preview-title")).to_have_text(title)
            expect(page.locator("#preview-description")).not_to_be_empty()
            page.keyboard.press("Escape")
            expect(page.locator("#book-dialog")).not_to_be_visible()
        for name in ("rooftop", "garden", "rocket"):
            card = page.locator(f'[data-peek="{name}"]')
            title = card.get_attribute("data-title")
            card.click()
            expect(page.locator("#peek-dialog-title")).to_have_text(title)
            expect(page.locator("#peek-dialog-image")).to_have_attribute("src", f"assets/{name}-colored.svg")
            page.keyboard.press("Escape")
            expect(page.locator("#peek-dialog")).not_to_be_visible()
            expect(card.locator(".peek-paper img").first).to_have_attribute("src", f"assets/{name}-colored.svg")
        print("PASS every book and page preview; Escape closes dialogs")

        crew = page.locator(".crew-art-button")
        crew.click()
        expect(crew).to_have_attribute("aria-pressed", "true")
        expect(page.locator("#story")).to_have_class("crew is-colored")
        crew.press("Enter")
        expect(crew).to_have_attribute("aria-pressed", "false")
        crew.press("Space")
        expect(crew).to_have_attribute("aria-pressed", "true")
        print("PASS crew coloring by pointer, Enter, and Space")

        page.locator("#open-studio").click()
        shapes = page.locator("#color-canvas [data-part]")
        expect(shapes).to_have_count(25)
        shape = shapes.nth(1)
        page.get_by_role("button", name="Lavender", exact=True).click()
        shape.focus()
        shape.press("Enter")
        expect(page.locator("#studio-status")).to_contain_text("colored lavender")
        assert shape.evaluate("element => element.style.fill") == "rgb(183, 155, 221)"
        expect(page.locator("#reset-color")).to_be_enabled()
        page.get_by_role("button", name="White eraser", exact=True).click()
        shape.focus()
        shape.press("Space")
        assert shape.evaluate("element => element.style.fill") == "rgb(255, 255, 255)"
        expect(page.locator("#studio-status")).to_contain_text("erased")
        page.locator("#reset-color").click()
        assert shapes.evaluate_all("elements => elements.every(element => !element.style.fill)")
        expect(page.locator("#reset-color")).to_be_disabled()
        page.get_by_role("button", name="Peach pink", exact=True).click()
        shape.focus()
        shape.press("Enter")
        with page.expect_download() as downloaded:
            page.locator("#download-art").click()
        download = downloaded.value
        assert download.suggested_filename == "miso-and-the-moon.png"
        assert Path(download.path()).read_bytes().startswith(b"\x89PNG\r\n\x1a\n")
        page.keyboard.press("Escape")
        expect(page.locator("#color-dialog")).not_to_be_visible()
        print("PASS studio keyboard coloring, eraser, reset, real PNG export")

        video = page.locator("#coloring-video")
        assert video.evaluate("element => element.paused && !element.autoplay && !element.hasAttribute('autoplay')")
        assert video.evaluate("element => getComputedStyle(element).objectFit") == "contain"
        page.locator(".video-play").focus()
        page.locator(".video-play").press("Enter")
        page.wait_for_function("!document.querySelector('#coloring-video').paused && document.querySelector('#coloring-video').currentTime > 0")
        expect(page.locator(".video-play")).not_to_be_visible()
        expect(video).to_be_focused()
        dimensions = video.evaluate("element => [element.videoWidth, element.videoHeight]")
        assert dimensions[0] > 0 and dimensions[1] > dimensions[0], dimensions
        video.press("Space")
        page.wait_for_function("document.querySelector('#coloring-video').paused")
        expect(page.locator(".video-play")).to_be_visible()
        print("PASS video keyboard playback, focus, pause, and complete portrait frame")

        questions = page.locator(".faq details")
        questions.nth(0).locator("summary").click()
        expect(questions.nth(0)).to_have_attribute("open", "")
        questions.nth(1).locator("summary").click()
        expect(questions.nth(1)).to_have_attribute("open", "")
        expect(questions.nth(0)).not_to_have_attribute("open", "")
        form = page.locator("#moon-mail-form")
        form.locator('[type="submit"]').click()
        expect(page.locator("#mail-email")).to_have_attribute("aria-invalid", "true")
        page.locator("#mail-email").fill("bad-email")
        form.locator('[type="submit"]').click()
        expect(page.locator("#mail-status")).to_contain_text("lost in space")
        page.locator("#mail-email").fill("reader@example.com")
        form.locator('[type="submit"]').click()
        expect(form).not_to_be_visible()
        expect(page.locator(".mail-success")).to_contain_text("Email subscriptions will open soon")
        print("PASS exclusive FAQ and newsletter validation/preview")

        # Also request lazy assets hidden by mobile-only presentation rules.
        # Such images correctly stay unloaded during ordinary mobile browsing.
        page.locator("footer").scroll_into_view_if_needed()
        page.locator("img").evaluate_all("images => images.forEach(image => image.loading = 'eager')")
        page.wait_for_function("Array.from(document.images).every(image => image.complete)")
        broken_images = page.locator("img").evaluate_all("images => images.filter(image => !image.naturalWidth).map(image => image.src)")
        assert not broken_images, broken_images
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow at {width}px"
        page.emulate_media(reduced_motion="reduce")
        assert page.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == "auto"
        assert not errors, errors
        assert not failures, failures
        print("PASS responsive overflow, image loads, no console errors or failed requests")
        browser.close()


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("BASE_URL", "http://localhost:8000"))
