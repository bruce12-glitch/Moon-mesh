import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  const masthead = $(".masthead");
  if (masthead) masthead.classList.add("is-ready");

  // Reveal controls that need JavaScript. Without JS the content stays readable.
  $$("[data-catalog]").forEach((trigger) => { trigger.hidden = false; });
  $$(".book-save").forEach((button) => { button.hidden = false; });
  const openStudioButton = $("#open-studio");
  if (openStudioButton) openStudioButton.hidden = false;

  /* -------------------------------------------------------- Coloring clip */

  const videoDialog = $("#video-dialog");
  const coloringVideo = $("#coloring-video");
  const videoStatus = $("#video-status");
  const inlineVideo = $("#inline-coloring-video");
  const clipToggle = $(".clip-toggle");
  const clipStatus = $(".clip-status");
  let clipInView = false;
  let clipPausedByUser = false;
  let clipStartedByUser = false;

  function syncInlinePlayback() {
    if (!inlineVideo) return;
    const shouldPlay = clipInView && !document.hidden && !videoDialog?.open &&
      !clipPausedByUser && (!reduceMotion.matches || clipStartedByUser);
    if (shouldPlay) {
      inlineVideo.play().catch(() => {
        // The visible play button also works when autoplay is blocked.
      });
    } else {
      inlineVideo.pause();
    }
  }

  if (inlineVideo) {
    inlineVideo.muted = true;
    inlineVideo.controls = false;
    if (clipToggle) {
      clipToggle.hidden = true;
    }
    inlineVideo.addEventListener("click", () => {
      if (inlineVideo.paused) {
        clipPausedByUser = false;
        clipStartedByUser = true;
        syncInlinePlayback();
      } else {
        clipPausedByUser = true;
        inlineVideo.pause();
      }
    });
    inlineVideo.addEventListener("error", () => {
      if (clipStatus) {
        clipStatus.textContent = "The clip couldn’t load.";
      }
    });
    if ("IntersectionObserver" in window) {
      const clipObserver = new IntersectionObserver(([entry]) => {
        clipInView = entry.isIntersecting;
        syncInlinePlayback();
      }, { threshold: 0 });
      clipObserver.observe(inlineVideo);
    }
    document.addEventListener("visibilitychange", syncInlinePlayback);
    reduceMotion.addEventListener("change", syncInlinePlayback);
  }

  if (videoDialog && coloringVideo && typeof videoDialog.showModal === "function") {
    $$("[data-watch]").forEach((link) => {
      link.setAttribute("aria-haspopup", "dialog");
      link.setAttribute("aria-controls", "video-dialog");
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        videoStatus.textContent = "";
        videoDialog.showModal();
        syncInlinePlayback();
        coloringVideo.currentTime = 0;
        coloringVideo.play().catch(() => {
          if (videoDialog.open && !coloringVideo.error) {
            videoStatus.textContent = "Press play in the video controls to watch the clip.";
          }
        });
      });
    });
    videoDialog.addEventListener("close", () => {
      coloringVideo.pause();
      syncInlinePlayback();
    });
    coloringVideo.addEventListener("error", () => {
      videoStatus.replaceChildren(document.createTextNode("The clip couldn’t load. "));
      const fallback = document.createElement("a");
      fallback.href = "assets/coloring-table.mp4";
      fallback.className = "text-link";
      fallback.textContent = "Open the video directly";
      videoStatus.append(fallback);
    });
  }

  /* ---------------------------------------------------------------- Books */

  const bookDialog = $("#book-dialog");
  const previewArt = $(".preview-art", bookDialog);
  const previewSave = $("#preview-save");
  const previewColor = $("#preview-color");
  const previews = {
    "midnight-kittens-details": "Follow Miso over sleepy rooftops, past glowing lanterns, and up to a crescent moon. A quiet adventure for the last few minutes before bedtime.",
    "starlight-garden-details": "Help Miso water flowers that look like stars, say hello to a snail, and see what else grows after the sun goes down.",
    "pocket-sized-planet-details": "Climb aboard Miso’s little rocket for ringed planets, twisty comets, and a trip through space with your favorite crayons.",
  };

  const bookCards = $$(".book-card");
  const books = bookCards.map((card) => {
    const previewLink = $("[data-preview]", card);
    return {
      id: card.id,
      title: $("h3", card).textContent.trim(),
      theme: $(".book-genre", card).textContent.trim(),
      keywords: [
        previews[previewLink.dataset.preview],
        $(".book-caption > p:not(.book-genre)", card)?.textContent,
        "book coloring colouring preview amazon",
      ].join(" "),
      image: $(".cover img", card).getAttribute("src"),
      card,
    };
  });
  const bookIds = new Set(books.map((book) => book.id));
  const savedKey = "moon-mesh-saved-books";
  let saved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(savedKey));
    if (Array.isArray(stored)) saved = new Set(stored.filter((id) => bookIds.has(id)));
  } catch {
    // Saving still works in memory when browser storage is unavailable.
  }

  const savedTrigger = $(".saved-trigger");
  const savedCount = $(".saved-count");

  function syncPreviewSave() {
    const id = bookDialog.dataset.bookId;
    if (!id) return;
    const isSaved = saved.has(id);
    previewSave.setAttribute("aria-pressed", String(isSaved));
    $("span", previewSave).textContent = isSaved ? "Saved to your shelf" : "Save this book";
  }

  function syncSaved() {
    savedCount.textContent = String(saved.size);
    savedTrigger.setAttribute(
      "aria-label",
      saved.size ? "Saved books, " + saved.size + (saved.size === 1 ? " book" : " books") : "Saved books"
    );
    books.forEach((book) => {
      const button = $(".book-save", book.card);
      const isSaved = saved.has(book.id);
      button.setAttribute("aria-pressed", String(isSaved));
      button.setAttribute(
        "aria-label",
        (isSaved ? "Remove " : "Save ") + book.title + (isSaved ? " from saved books" : " to saved books")
      );
    });
    syncPreviewSave();
    if (catalogMode === "saved" && catalog.open) renderCatalog();
  }

  function toggleSaved(id) {
    if (!id) return;
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    try {
      localStorage.setItem(savedKey, JSON.stringify([...saved]));
    } catch {
      // Keep the current selection for this visit.
    }
    syncSaved();
  }

  books.forEach((book) => {
    $(".book-save", book.card).addEventListener("click", () => toggleSaved(book.id));
    const art = $(".book-art", book.card);
    art.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || reduceMotion.matches || event.pointerType === "touch") return;
      const bounds = art.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      art.style.setProperty("--book-rx", (-y * 6).toFixed(2) + "deg");
      art.style.setProperty("--book-ry", (x * 8).toFixed(2) + "deg");
    });
    art.addEventListener("pointerleave", () => {
      art.style.removeProperty("--book-rx");
      art.style.removeProperty("--book-ry");
    });
  });

  function openBook(card) {
    const book = books.find((item) => item.card === card);
    if (!book) return;
    const cover = $(".cover", card).cloneNode(true);
    const coverImage = $("img", cover);
    if (coverImage) {
      coverImage.setAttribute("loading", "eager");
      coverImage.alt = "";
    }
    cover.setAttribute("aria-hidden", "true");
    previewArt.className = "preview-art " + card.classList[1];
    previewArt.replaceChildren(cover);
    $("#preview-title").textContent = book.title;
    $("#preview-description").textContent = previews[$("[data-preview]", card).dataset.preview];
    bookDialog.dataset.bookId = book.id;
    syncPreviewSave();
    bookDialog.showModal();
  }

  $$("[data-preview]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openBook(link.closest(".book-card"));
    });
  });

  previewSave.addEventListener("click", () => toggleSaved(bookDialog.dataset.bookId));
  previewColor.addEventListener("click", () => {
    bookDialog.close();
    openStudioPage();
  });
  if (bookDialog) {
    bookDialog.addEventListener("close", () => {
      delete bookDialog.dataset.bookId;
    });
  }

  /* -------------------------------------------------------------- Catalog */

  const catalog = $("#catalog-dialog");
  const catalogTitle = $("#catalog-title");
  const catalogSearch = $(".catalog-search", catalog);
  const catalogInput = $("input", catalogSearch);
  const catalogStatus = $(".catalog-status", catalog);
  const catalogResults = $(".catalog-results", catalog);
  const catalogPages = [
    {
      title: "From the coloring table",
      theme: "Watch a 16-second coloring clip",
      href: "#watch",
      image: "assets/coloring-table-poster.webp",
      keywords: "video watch clip markers puppies coloring table",
    },
    {
      title: "Miso & the Moon",
      theme: "Free coloring page",
      href: "#color",
      image: "assets/miso-moon-coloring.svg",
      keywords: "free printable print pdf color online colouring download club page miso moon studio",
    },
    {
      title: "Peek inside the books",
      theme: "Line-art gallery",
      href: "#peek",
      image: "assets/rooftop-coloring.svg",
      keywords: "peek inside pages gallery line art lineart sample interior look",
    },
    {
      title: "Meet Miso and friends",
      theme: "Our story",
      href: "#story",
      image: "assets/crew-miso.svg",
      keywords: "kitten cat rabbit snail star crew characters friends story",
    },
    {
      title: "Frequently asked questions",
      theme: "Good to know",
      href: "#faq",
      image: "assets/brand-logo.webp",
      keywords: "help parents ages printing buy purchase questions faq",
    },
    {
      title: "Moon Mail",
      theme: "A little letter",
      href: "#moon-mail",
      image: "assets/brand-logo.webp",
      keywords: "newsletter email letter subscribe updates moon mail",
    },
  ];
  let catalogMode = "search";

  function makeCatalogResult(item) {
    const li = document.createElement("li");
    const control = document.createElement(item.href ? "a" : "button");
    control.className = "catalog-result";
    if (item.href) {
      control.href = item.href;
      control.addEventListener("click", () => catalog.close());
    } else {
      control.type = "button";
      control.addEventListener("click", () => {
        catalog.close();
        openBook(item.card);
      });
    }
    const art = document.createElement("span");
    art.className = "result-art";
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = "";
    image.loading = "lazy";
    art.append(image);
    const label = document.createElement("span");
    label.className = "result-label";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const theme = document.createElement("small");
    theme.textContent = item.theme;
    label.append(title, theme);
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    control.append(art, label, arrow);
    li.append(control);
    return li;
  }

  function renderCatalog() {
    const query = catalogInput.value.toLowerCase().trim();
    const tokens = query.split(/\s+/).filter(Boolean);
    const isSaved = catalogMode === "saved";
    const results = isSaved
      ? books.filter((book) => saved.has(book.id))
      : [...books, ...catalogPages].filter((item) => {
        const text = [item.title, item.theme, item.keywords].join(" ").toLowerCase();
        return tokens.every((token) => text.includes(token));
      });
    catalogResults.replaceChildren(...results.map(makeCatalogResult));
    if (isSaved) {
      catalogStatus.textContent = results.length
        ? "Saved in this browser. Tap a book to peek inside."
        : "Tap a heart on a book to save it here.";
    } else {
      catalogStatus.textContent = results.length
        ? query
          ? results.length + (results.length === 1 ? " match" : " matches")
          : "Explore books, free pages, and more."
        : "No matches. Try a word like “moon,” “space,” or “printable.”";
    }
  }

  $$("[data-catalog]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      catalogMode = trigger.dataset.catalog;
      catalogInput.value = "";
      catalogTitle.textContent = catalogMode === "saved" ? "Saved books" : "Find a book or page";
      catalogSearch.hidden = catalogMode === "saved";
      renderCatalog();
      catalog.showModal();
      if (!catalogSearch.hidden) requestAnimationFrame(() => catalogInput.focus());
    });
  });
  catalogInput.addEventListener("input", renderCatalog);

  /* ----------------------------------------------------------- Peek pages */

  const peekDialog = $("#peek-dialog");
  const peekImage = $("#peek-dialog-image");
  const peekTitle = $("#peek-dialog-title");
  const peekDescription = $("#peek-dialog-description");
  const peekCta = $("#peek-dialog-cta");
  const peekPages = {
    rooftop: "assets/rooftop-colored.svg",
    garden: "assets/garden-colored.svg",
    rocket: "assets/rocket-colored.svg",
  };

  function openPeek(card) {
    const image = peekPages[card.dataset.peek];
    if (!image) return;
    peekImage.src = image;
    peekImage.alt = "Colored illustration: " + card.dataset.title + ".";
    peekTitle.textContent = card.dataset.title;
    peekDescription.textContent = card.dataset.description;
    peekDialog.showModal();
  }

  $$(".peek-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openPeek(card);
    });
  });

  peekCta.addEventListener("click", (event) => {
    event.preventDefault();
    peekDialog.close();
    openStudioPage();
  });

  /* ------------------------------------------------------------ Crew mode */

  const crew = $("#story");
  const crewToggle = $(".crew-art-button", crew);
  if (crewToggle) {
    const setCrewColor = (showColor) => {
      crewToggle.setAttribute("aria-pressed", String(showColor));
      crewToggle.setAttribute("aria-label", showColor ? "Show Miso and friends as a drawing" : "Show Miso and friends in color");
      crew.classList.toggle("is-colored", showColor);
    };
    crewToggle.addEventListener("pointerenter", (event) => {
      if (finePointer.matches && event.pointerType !== "touch") setCrewColor(true);
    });
    crewToggle.addEventListener("pointerleave", () => {
      if (finePointer.matches) setCrewColor(crewToggle.matches(":focus-visible"));
    });
    crewToggle.addEventListener("focus", () => {
      if (crewToggle.matches(":focus-visible")) setCrewColor(true);
    });
    crewToggle.addEventListener("blur", () => {
      if (!finePointer.matches || !crewToggle.matches(":hover")) setCrewColor(false);
    });
    crewToggle.addEventListener("click", (event) => {
      if (event.detail > 0 && finePointer.matches) return;
      setCrewColor(crewToggle.getAttribute("aria-pressed") !== "true");
    });
  }

  /* ------------------------------------------------------------ Gift tab */

  const giftTab = $(".gift-tab");
  const giftKey = "moon-mesh-free-page-shortcut-dismissed";
  let giftDismissed = false;
  try {
    giftDismissed = sessionStorage.getItem(giftKey) === "yes";
  } catch {
    // The shortcut can still be dismissed for this page.
  }

  if (giftTab && !giftDismissed) {
    const hero = $(".hero");
    const coloring = $("#color");
    let pastHero = false;
    let coloringVisible = false;
    const updateGiftTab = () => {
      giftTab.hidden = !pastHero || coloringVisible;
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
          if (entry.target === coloring) coloringVisible = entry.isIntersecting;
        });
        updateGiftTab();
      });
      observer.observe(hero);
      observer.observe(coloring);
      $("button", giftTab).addEventListener("click", () => {
        observer.disconnect();
        giftTab.hidden = true;
        try {
          sessionStorage.setItem(giftKey, "yes");
        } catch {
          // Dismissal still applies until this page is closed.
        }
      });
    }
  } else if (giftTab) {
    giftTab.hidden = true;
  }

  /* ------------------------------------------------------------ Moon Mail */

  const mailForm = $("#moon-mail-form");
  const mailEmail = $("#mail-email");
  const mailStatus = $("#mail-status");
  const mailSuccess = $(".mail-success");

  function setMailError(message) {
    mailStatus.textContent = message;
    mailStatus.classList.add("is-error");
    mailEmail.setAttribute("aria-invalid", "true");
    mailEmail.focus();
  }

  function clearMailError() {
    mailStatus.textContent = "";
    mailStatus.classList.remove("is-error");
    mailEmail.removeAttribute("aria-invalid");
  }

  mailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = mailEmail.value.trim();
    if (!value) {
      setMailError("Add an email so we know where to send the moon.");
      return;
    }
    if (!mailEmail.validity.valid) {
      setMailError("That email looks a little lost in space. Try again?");
      return;
    }
    clearMailError();
    mailForm.hidden = true;
    mailSuccess.hidden = false;
    mailSuccess.setAttribute("tabindex", "-1");
    mailSuccess.focus();
  });
  mailEmail.addEventListener("input", () => {
    if (mailEmail.getAttribute("aria-invalid") === "true") clearMailError();
  });

  /* ------------------------------------------------------- Coloring studio */

  const studio = $("#color-dialog");
  const canvas = $("#color-canvas");
  const palette = $(".palette", studio);
  const reset = $("#reset-color");
  const status = $("#studio-status");
  const downloadArt = $("#download-art");
  const pageUrl = "assets/miso-moon-coloring.svg";
  let swatch = palette.querySelector('[aria-pressed="true"]');

  async function loadStudioPage() {
    if (canvas.querySelector("svg")) return true;
    canvas.textContent = "Getting Miso’s page ready…";
    canvas.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(pageUrl);
      if (!response.ok) throw new Error("Coloring page unavailable");
      const parsed = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      const svg = parsed.documentElement;
      if (!svg || svg.localName !== "svg") throw new Error("Coloring page could not be read");
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-label", "Miso and the Moon coloring shapes");
      $$("[data-part]", svg).forEach((part) => {
        part.setAttribute("tabindex", "0");
        part.setAttribute("role", "button");
        part.setAttribute("aria-label", part.dataset.part);
      });
      canvas.replaceChildren(document.importNode(svg, true));
      return true;
    } catch {
      canvas.textContent = "The coloring page couldn’t load. Close the studio and try again, or print the blank page below.";
      return false;
    } finally {
      canvas.removeAttribute("aria-busy");
    }
  }

  async function openStudioPage() {
    studio.showModal();
    const loaded = await loadStudioPage();
    downloadArt.hidden = !loaded;
  }

  if (openStudioButton) openStudioButton.addEventListener("click", openStudioPage);

  palette.addEventListener("click", (event) => {
    const selected = event.target.closest("[data-color]");
    if (!selected) return;
    swatch.setAttribute("aria-pressed", "false");
    swatch = selected;
    swatch.setAttribute("aria-pressed", "true");
    status.textContent = selected.getAttribute("aria-label") + " selected.";
  });

  function colorPart(part) {
    const color = swatch.dataset.color;
    const name = swatch.getAttribute("aria-label");
    const isEraser = ["#FFFFFF", "#FFFDF7"].includes(color.toUpperCase());
    part.style.fill = color;
    part.setAttribute("aria-label", isEraser ? part.dataset.part : part.dataset.part + ", " + name);
    status.textContent = isEraser
      ? part.dataset.part + " erased."
      : part.dataset.part + " colored " + name.toLowerCase() + ".";
    reset.disabled = false;
  }

  canvas.addEventListener("click", (event) => {
    const part = event.target.closest("[data-part]");
    if (part) colorPart(part);
  });
  canvas.addEventListener("keydown", (event) => {
    const part = event.target.closest("[data-part]");
    if (part && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      colorPart(part);
    }
  });

  reset.addEventListener("click", () => {
    $$("[data-part]", canvas).forEach((part) => {
      part.style.removeProperty("fill");
      part.setAttribute("aria-label", part.dataset.part);
    });
    status.textContent = "Coloring page cleared.";
    swatch.focus();
    reset.disabled = true;
  });

  downloadArt.addEventListener("click", async () => {
    const svg = canvas.querySelector("svg");
    if (!svg) return;
    downloadArt.disabled = true;
    status.textContent = "Wrapping up your page…";
    let svgUrl;
    try {
      const clone = svg.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1040");
      clone.setAttribute("height", "1040");
      clone.removeAttribute("role");
      clone.removeAttribute("aria-label");
      $$("[role], [tabindex]", clone).forEach((element) => {
        element.removeAttribute("role");
        element.removeAttribute("tabindex");
      });
      const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml;charset=utf-8",
      });
      svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.decoding = "async";
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("The page could not be drawn"));
        image.src = svgUrl;
      });

      const output = document.createElement("canvas");
      output.width = output.height = 1040;
      const context = output.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, 1040, 1040);
      context.drawImage(image, 0, 0, 1040, 1040);

      const pngBlob = await new Promise((resolve) => output.toBlob(resolve, "image/png"));
      if (!pngBlob) throw new Error("The PNG could not be made");
      const pngUrl = URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "miso-and-the-moon.png";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 4000);
      status.textContent = "Your page is saved as a PNG in your downloads.";
    } catch {
      status.textContent = "The PNG couldn’t be made. You can still print the blank page below.";
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      downloadArt.disabled = false;
    }
  });

  /* --------------------------------------------------------------- Nav cue */

  const navLinks = $$('.main-nav a[href^="#"]');
  const navSections = navLinks
    .map((link) => ({ link, section: $(link.getAttribute("href")) }))
    .filter((item) => item.section);

  if ("IntersectionObserver" in window && navSections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.removeAttribute("aria-current"));
          const item = navSections.find((candidate) => candidate.section === entry.target);
          if (item) item.link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    navSections.forEach((item) => navObserver.observe(item.section));
  }

  /* ----------------------------------------------------------- FAQ smooth */

  const faqDetails = $$(".faq details");
  faqDetails.forEach((detail) => {
    const summary = $("summary", detail);
    if (!summary) return;
    summary.addEventListener("click", (event) => {
      if (reduceMotion.matches) return;
      event.preventDefault();
      if (detail.open && !detail.classList.contains("is-closing")) {
        detail.classList.add("is-closing");
        window.setTimeout(() => {
          detail.open = false;
          detail.classList.remove("is-closing");
        }, 360);
      } else {
        faqDetails.forEach((other) => {
          if (other !== detail && other.open && !other.classList.contains("is-closing")) {
            other.classList.add("is-closing");
            window.setTimeout(() => {
              other.open = false;
              other.classList.remove("is-closing");
            }, 360);
          }
        });
        detail.classList.remove("is-closing");
        detail.classList.add("is-expanding");
        detail.open = true;
        void detail.offsetHeight;
        detail.classList.remove("is-expanding");
      }
    });
  });


  /* --------------------------------------------------------- Hero Carousel */
  const heroCarousel = $("[data-hero-carousel]");
  if (heroCarousel) {
    const slides = $("[data-hero-slide]", heroCarousel);
    const dots = $("[data-hero-dot]", heroCarousel);
    const ambients = $("[data-ambient]", heroCarousel);
    const prevBtn = $("[data-hero-prev]", heroCarousel);
    const nextBtn = $("[data-hero-next]", heroCarousel);
    const toggleBtn = $("[data-hero-toggle]", heroCarousel);
    let activeSlideIdx = 0;
    let autoPlay = !reduceMotion.matches;
    let timerId = 0;
    let touchStartX = null;

    function renderHeroSlide(index) {
      const total = slides.length;
      activeSlideIdx = ((index % total) + total) % total;
      const current = slides[activeSlideIdx];
      const bg = current.getAttribute("data-bg") || "#FAF2E9";
      const ambientKey = current.getAttribute("data-ambient-key") || "moon-color";
      heroCarousel.style.backgroundColor = bg;

      slides.forEach((slide, i) => {
        const isCurrent = i === activeSlideIdx;
        slide.classList.toggle("is-active", isCurrent);
        slide.setAttribute("aria-hidden", isCurrent ? "false" : "true");
      });

      dots.forEach((dot, i) => {
        const isSelected = i === activeSlideIdx;
        dot.classList.toggle("is-selected", isSelected);
        dot.setAttribute("aria-selected", isSelected ? "true" : "false");
      });

      ambients.forEach((el) => {
        el.hidden = el.getAttribute("data-ambient") !== ambientKey;
      });
    }

    function restartHeroTimer() {
      window.clearInterval(timerId);
      if (autoPlay && !reduceMotion.matches) {
        timerId = window.setInterval(() => {
          renderHeroSlide(activeSlideIdx + 1);
        }, 6500);
      }
    }

    function setHeroAutoPlay(nextState) {
      autoPlay = nextState;
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", autoPlay ? "true" : "false");
        toggleBtn.setAttribute("aria-label", autoPlay ? "Pause slide rotation" : "Play slide rotation");
        toggleBtn.textContent = autoPlay ? "Pause" : "Play";
      }
      restartHeroTimer();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        setHeroAutoPlay(false);
        renderHeroSlide(activeSlideIdx - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        setHeroAutoPlay(false);
        renderHeroSlide(activeSlideIdx + 1);
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        setHeroAutoPlay(false);
        renderHeroSlide(idx);
      });
    });

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        setHeroAutoPlay(!autoPlay);
      });
    }

    heroCarousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setHeroAutoPlay(false);
        renderHeroSlide(activeSlideIdx + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setHeroAutoPlay(false);
        renderHeroSlide(activeSlideIdx - 1);
      }
    });

    heroCarousel.addEventListener("touchstart", (event) => {
      if (event.touches && event.touches.length) {
        touchStartX = event.touches[0].clientX;
      }
    }, { passive: true });

    heroCarousel.addEventListener("touchend", (event) => {
      if (touchStartX === null || !event.changedTouches || !event.changedTouches.length) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 45) {
        setHeroAutoPlay(false);
        renderHeroSlide(deltaX < 0 ? activeSlideIdx + 1 : activeSlideIdx - 1);
      }
      touchStartX = null;
    }, { passive: true });

    renderHeroSlide(0);
    restartHeroTimer();
  }


    /* --------------------------------------------------- 3D Moon Picnic Modal (Three.js WebGL Diorama) */
  const threeModal = $("#three-picnic-modal");
  const threeMount = $("#three-canvas-mount");
  const open3DBtns = $("[data-open-3d]");
  const close3DBtn = $("[data-close-3d]");
  const threeColorBtn = $("[data-three-color]");
  const toggleDockBtn = $("[data-toggle-3d-dock]");
  const bottomDock = $("#three-bottom-dock");
  const camButtons = $("[data-cam-preset]");
  const moodButtons = $("[data-light-mood]");
  const spreadInput = $("[data-three-spread]");
  const spreadVal = $("[data-three-spread-val]");
  const cardBadgeEl = $("#three-card-badge");
  const cardTitleEl = $("#three-modal-title");
  const cardDescEl = $("#three-card-desc");

  const PRESET_INFO = {
    overview: {
      pos: [0, 3.85, 7.35],
      target: [0, 1.45, 0.1],
      badge: "Story World · 4 Characters",
      title: "The Little Moon Picnic · Ages 6–9",
      desc: "Rain taps the porch outside, so Miso, Pip, Plum, and Sprout turn the garden nook into a moonlit indoor picnic with paper moons, warm buns, and coloring pages."
    },
    miso: {
      pos: [-1.55, 2.45, 4.15],
      target: [-1.15, 1.38, 0.2],
      badge: "Cream Kitten · Scale 1.00",
      title: "Miso · The Daydreamer",
      desc: "Wearing her mustard-yellow scarf and sky-blue striped ear bow, Miso holds a warm cocoa mug and passes a honey bun across the table."
    },
    plum: {
      pos: [1.65, 2.45, 4.15],
      target: [1.15, 1.38, 0.2],
      badge: "Lavender Lop Bunny · Scale 0.95",
      title: "Plum · The Kind Heart",
      desc: "Tucked in her strawberry cap with drooping lop ears, Plum saves a cushion at the table and shares her favorite tulips and crayons."
    },
    pip: {
      pos: [-1.25, 1.75, 3.35],
      target: [-0.95, 0.68, 1.25],
      badge: "Five-Point Star · Scale 0.45",
      title: "Pip · The Bright Idea",
      desc: "A cheerful butter-yellow star who hung the three paper moons in the window and guards the polka-dot bowl of picnic berries."
    },
    sprout: {
      pos: [0.85, 1.95, 2.65],
      target: [0.48, 1.02, 0.38],
      badge: "Garden Snail · Scale 0.30",
      title: "Sprout · The Slow-and-Steady",
      desc: "Perched on a scalloped leaf tray with two curious eye stalks and a coiled sage shell, admiring one very good picnic strawberry."
    },
    window: {
      pos: [0, 3.35, 4.75],
      target: [0, 2.65, -1.9],
      badge: "3 Hanging Paper Moons",
      title: "Arched Crescent Window",
      desc: "Outside the timber arch, a fat golden crescent moon glows between sleepy clouds while three handmade paper moons sway indoors."
    }
  };

  if (threeModal && threeMount) {
    let activePreset = "overview";
    let activeMood = "moonlight";
    let spreadPct = 0;
    let transitionActive = true;
    let isInitialized = false;
    let requestRenderFn = null;

    function syncCardUI(presetKey) {
      const info = PRESET_INFO[presetKey] || PRESET_INFO.overview;
      if (cardBadgeEl) cardBadgeEl.textContent = info.badge;
      if (cardTitleEl) cardTitleEl.textContent = info.title;
      if (cardDescEl) cardDescEl.textContent = info.desc;
    }

    function initThreeScene() {
      if (isInitialized) return;
      isInitialized = true;

      const isSoftwareGl = (() => {
        const gl = document.createElement("canvas").getContext("webgl2");
        if (!gl) return true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      })();

      const width = threeMount.clientWidth || window.innerWidth;
      const height = threeMount.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, powerPreference: "high-performance" });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      threeMount.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x221b33);
      scene.fog = new THREE.FogExp2(0x221b33, 0.018);

      if (!isSoftwareGl) {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        pmremGenerator.dispose();
      }

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 3.85, 7.35);
      camera.lookAt(0, 1.45, 0.1);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.minDistance = 2.1;
      controls.maxDistance = 12.5;
      controls.target.set(0, 1.45, 0.1);

      const hemiLight = new THREE.HemisphereLight(0xfff0d4, 0xc4b5fd, isSoftwareGl ? 1.45 : 1.05);
      hemiLight.position.set(0, 12, 0);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff3d6, isSoftwareGl ? 2.3 : 2.1);
      keyLight.position.set(4.2, 7.8, 5.2);
      keyLight.castShadow = !isSoftwareGl;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xa78bfa, 1.15);
      rimLight.position.set(-4.5, 5.0, -4.0);
      scene.add(rimLight);

      const lanternPointLight = new THREE.PointLight(0xffcf6b, 1.8, 9.5, 1.4);
      lanternPointLight.position.set(0, 3.1, 0.4);
      scene.add(lanternPointLight);

      const outlineMat = new THREE.MeshBasicMaterial({ color: 0x2c2523, side: THREE.BackSide });
      const addInkOutline = (mesh, scale = 1.045) => {
        const outline = new THREE.Mesh(mesh.geometry, outlineMat);
        outline.scale.setScalar(scale);
        mesh.add(outline);
        return mesh;
      };

      const makeWoodTex = () => {
        const c = document.createElement("canvas");
        c.width = 512; c.height = 512;
        const cx = c.getContext("2d");
        cx.fillStyle = "#C89262"; cx.fillRect(0, 0, 512, 512);
        cx.strokeStyle = "#AD7749"; cx.lineWidth = 4;
        for (let i = 0; i < 36; i++) {
          const y = (i / 36) * 512;
          cx.beginPath(); cx.moveTo(0, y);
          cx.bezierCurveTo(170, y + Math.sin(i) * 10, 340, y - Math.cos(i) * 10, 512, y);
          cx.stroke();
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };

      const makeRugTex = () => {
        const c = document.createElement("canvas");
        c.width = 512; c.height = 512;
        const cx = c.getContext("2d");
        cx.fillStyle = "#FFFDF7"; cx.fillRect(0, 0, 512, 512);
        cx.fillStyle = "#F5EEFC";
        for (let x = 44; x < 468; x += 32) {
          for (let y = 44; y < 468; y += 32) {
            if (((x + y) / 32) % 2 === 0) cx.fillRect(x, y, 16, 16);
          }
        }
        cx.strokeStyle = "#D7C4EE"; cx.lineWidth = 22; cx.strokeRect(28, 28, 456, 456);
        cx.strokeStyle = "#F5C95D"; cx.lineWidth = 8; cx.strokeRect(52, 52, 408, 408);
        cx.strokeStyle = "#2C2523"; cx.lineWidth = 5; cx.strokeRect(14, 14, 484, 484);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };

      const makeBowTex = () => {
        const c = document.createElement("canvas");
        c.width = 128; c.height = 128;
        const cx = c.getContext("2d");
        cx.fillStyle = "#89C4F4"; cx.fillRect(0, 0, 128, 128);
        cx.fillStyle = "#FFFFFF";
        for (let i = 0; i < 128; i += 24) cx.fillRect(i, 0, 9, 128);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };

      const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff5de, roughness: 0.68 });
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf6ca56, roughness: 0.45 });
      const lavenderMat = new THREE.MeshStandardMaterial({ color: 0xd5c4eb, roughness: 0.65 });
      const greenMat = new THREE.MeshStandardMaterial({ color: 0x9ab87a, roughness: 0.48 });
      const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x6f8d54, roughness: 0.52 });
      const coralMat = new THREE.MeshStandardMaterial({ color: 0xe36d6b, roughness: 0.38 });
      const strawberryCapMat = new THREE.MeshStandardMaterial({ color: 0xe25b5d, roughness: 0.46 });
      const inkMat = new THREE.MeshStandardMaterial({ color: 0x2c2523, roughness: 0.22 });
      const whiteCatchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xf49ab0 });
      const woodMat = new THREE.MeshStandardMaterial({ map: makeWoodTex(), roughness: 0.52 });
      const bowMat = new THREE.MeshStandardMaterial({ map: makeBowTex(), roughness: 0.45 });
      const ceramicMat = new THREE.MeshPhysicalMaterial({ color: 0xfffaf2, roughness: 0.16, clearcoat: 0.85 });
      const bunMat = new THREE.MeshStandardMaterial({ color: 0xe9a35e, roughness: 0.42 });
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x372c4d, roughness: 0.82, side: THREE.DoubleSide });
      const wainscotMat = new THREE.MeshStandardMaterial({ color: 0x4b3d66, roughness: 0.75, side: THREE.DoubleSide });

      const stageGroup = new THREE.Group();
      const baseCylinder = addInkOutline(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.75, 0.28, 48), woodMat), 1.018);
      baseCylinder.position.y = -0.14;
      stageGroup.add(baseCylinder);

      const backWall = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 4.5, 40, 1, true, Math.PI * 0.68, Math.PI * 0.64), wallMat);
      backWall.position.y = 2.25;
      stageGroup.add(backWall);

      const wainscotWall = new THREE.Mesh(new THREE.CylinderGeometry(4.46, 4.46, 1.15, 40, 1, true, Math.PI * 0.68, Math.PI * 0.64), wainscotMat);
      wainscotWall.position.y = 0.58;
      stageGroup.add(wainscotWall);

      const rugMesh = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.045, 3.8), new THREE.MeshStandardMaterial({ map: makeRugTex(), roughness: 0.78 }));
      rugMesh.position.set(0, 0.024, 0.35);
      stageGroup.add(rugMesh);

      const stringCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.6, 3.95, -1.3),
        new THREE.Vector3(-1.8, 3.55, -1.5),
        new THREE.Vector3(0, 3.4, -1.55),
        new THREE.Vector3(1.8, 3.55, -1.5),
        new THREE.Vector3(3.6, 3.95, -1.3),
      ]);
      stageGroup.add(new THREE.Mesh(new THREE.TubeGeometry(stringCurve, 32, 0.018, 8, false), inkMat));
      const lanternMat = new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffc83d, emissiveIntensity: 0.75 });
      for (let i = 1; i <= 7; i++) {
        const pt = stringCurve.getPoint(i / 8);
        const bulb = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), lanternMat), 1.07);
        bulb.scale.set(1, 1.18, 1);
        bulb.position.set(pt.x, pt.y - 0.12, pt.z);
        stageGroup.add(bulb);
      }
      scene.add(stageGroup);

      const torsoPoints = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.6, 0.02),
        new THREE.Vector2(0.64, 0.42),
        new THREE.Vector2(0.5, 0.92),
        new THREE.Vector2(0.0, 0.98),
      ];
      const eyeGeo = new THREE.SphereGeometry(0.058, 14, 14);
      const catchGeo = new THREE.SphereGeometry(0.022, 10, 10);
      const cheekGeo = new THREE.SphereGeometry(0.078, 14, 14);
      const noseGeo = new THREE.SphereGeometry(0.036, 12, 12);
      const pawGeo = new THREE.SphereGeometry(0.17, 16, 16);

      // Miso Group
      const misoGroup = new THREE.Group();
      misoGroup.position.set(-1.38, 0.045, 0.2);
      misoGroup.rotation.y = 0.42;
      const misoCushion = addInkOutline(new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.9, 0.24, 28), coralMat), 1.035);
      misoCushion.position.y = 0.12;
      const misoBody = addInkOutline(new THREE.Mesh(new THREE.LatheGeometry(torsoPoints, 28), creamMat), 1.04);
      misoBody.position.y = 0.2;
      const misoHead = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.65, 32, 28), creamMat), 1.042);
      misoHead.scale.set(1.18, 0.94, 1.02);
      misoHead.position.set(0, 1.54, 0.04);
      const earGeo = new THREE.ConeGeometry(0.25, 0.44, 18);
      const leftEar = addInkOutline(new THREE.Mesh(earGeo, creamMat), 1.06);
      leftEar.position.set(-0.42, 2.04, 0.02); leftEar.rotation.z = 0.28;
      const rightEar = addInkOutline(new THREE.Mesh(earGeo, creamMat), 1.06);
      rightEar.position.set(0.42, 2.04, 0.02); rightEar.rotation.z = -0.26;
      const scarfRing = addInkOutline(new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.125, 16, 32), yellowMat), 1.05);
      scarfRing.rotation.x = Math.PI / 2; scarfRing.position.set(0, 1.06, 0.04);
      const misoEyeL = new THREE.Mesh(eyeGeo, inkMat); misoEyeL.position.set(-0.24, 1.51, 0.67);
      const misoCatchL = new THREE.Mesh(catchGeo, whiteCatchlightMat); misoCatchL.position.set(-0.22, 1.53, 0.72);
      const misoEyeR = new THREE.Mesh(eyeGeo, inkMat); misoEyeR.position.set(0.24, 1.51, 0.67);
      const misoCatchR = new THREE.Mesh(catchGeo, whiteCatchlightMat); misoCatchR.position.set(0.26, 1.53, 0.72);
      const misoCheekL = new THREE.Mesh(cheekGeo, blushMat); misoCheekL.scale.set(1.3, 0.75, 0.4); misoCheekL.position.set(-0.38, 1.42, 0.63);
      const misoCheekR = new THREE.Mesh(cheekGeo, blushMat); misoCheekR.scale.set(1.3, 0.75, 0.4); misoCheekR.position.set(0.38, 1.42, 0.63);
      const misoNose = new THREE.Mesh(noseGeo, coralMat); misoNose.scale.set(1.2, 0.85, 0.7); misoNose.position.set(0, 1.46, 0.7);
      const smileL = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.016, 10, 18, Math.PI), inkMat);
      smileL.rotation.z = Math.PI; smileL.position.set(-0.05, 1.42, 0.69);
      const smileR = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.016, 10, 18, Math.PI), inkMat);
      smileR.rotation.z = Math.PI; smileR.position.set(0.05, 1.42, 0.69);
      misoGroup.add(misoCushion, misoBody, misoHead, leftEar, rightEar, scarfRing, misoEyeL, misoCatchL, misoEyeR, misoCatchR, misoCheekL, misoCheekR, misoNose, smileL, smileR);
      scene.add(misoGroup);

      // Plum Group
      const plumGroup = new THREE.Group();
      plumGroup.position.set(1.38, 0.045, 0.2);
      plumGroup.rotation.y = -0.44;
      const plumCushion = addInkOutline(new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.88, 0.24, 28), greenMat), 1.035);
      plumCushion.position.y = 0.12;
      const plumBody = addInkOutline(new THREE.Mesh(new THREE.LatheGeometry(torsoPoints, 28), lavenderMat), 1.04);
      plumBody.scale.set(0.95, 0.95, 0.95); plumBody.position.y = 0.2;
      const plumHead = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.61, 32, 28), lavenderMat), 1.042);
      plumHead.scale.set(1.14, 0.95, 1.0); plumHead.position.set(0, 1.46, 0.04);
      const lopEarGeo = new THREE.CapsuleGeometry(0.16, 0.56, 10, 18);
      const plumEarL = addInkOutline(new THREE.Mesh(lopEarGeo, lavenderMat), 1.06);
      plumEarL.position.set(-0.66, 1.18, 0.12); plumEarL.rotation.set(0.12, 0, -0.18);
      const plumEarR = addInkOutline(new THREE.Mesh(lopEarGeo, lavenderMat), 1.06);
      plumEarR.position.set(0.66, 1.16, 0.12); plumEarR.rotation.set(0.12, 0, 0.22);
      const capGroup = new THREE.Group();
      capGroup.position.set(0, 1.56, -0.02); capGroup.rotation.x = -0.32;
      const berryCap = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.66, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), strawberryCapMat), 1.04);
      berryCap.scale.set(1.14, 0.98, 1.04);
      capGroup.add(berryCap);
      const plumEyeL = new THREE.Mesh(eyeGeo, inkMat); plumEyeL.position.set(-0.22, 1.45, 0.63);
      const plumCatchL = new THREE.Mesh(catchGeo, whiteCatchlightMat); plumCatchL.position.set(-0.2, 1.47, 0.68);
      const plumEyeR = new THREE.Mesh(eyeGeo, inkMat); plumEyeR.position.set(0.22, 1.45, 0.63);
      const plumCatchR = new THREE.Mesh(catchGeo, whiteCatchlightMat); plumCatchR.position.set(0.24, 1.47, 0.68);
      const plumCheekL = new THREE.Mesh(cheekGeo, blushMat); plumCheekL.scale.set(1.25, 0.72, 0.4); plumCheekL.position.set(-0.36, 1.36, 0.59);
      const plumCheekR = new THREE.Mesh(cheekGeo, blushMat); plumCheekR.scale.set(1.25, 0.72, 0.4); plumCheekR.position.set(0.36, 1.36, 0.59);
      const plumNose = new THREE.Mesh(noseGeo, inkMat); plumNose.scale.set(1.15, 0.85, 0.7); plumNose.position.set(0, 1.41, 0.66);
      const plumSmileL = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.015, 10, 16, Math.PI), inkMat);
      plumSmileL.rotation.z = Math.PI; plumSmileL.position.set(-0.045, 1.37, 0.65);
      const plumSmileR = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.015, 10, 16, Math.PI), inkMat);
      plumSmileR.rotation.z = Math.PI; plumSmileR.position.set(0.045, 1.37, 0.65);
      plumGroup.add(plumCushion, plumBody, plumHead, plumEarL, plumEarR, capGroup, plumEyeL, plumCatchL, plumEyeR, plumCatchR, plumCheekL, plumCheekR, plumNose, plumSmileL, plumSmileR);
      scene.add(plumGroup);

      // Pip Group
      const pipGroup = new THREE.Group();
      pipGroup.position.set(-1.02, 0.045, 1.34);
      pipGroup.rotation.y = 0.28;
      const starShape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? 0.44 : 0.24;
        const x = Math.cos(angle) * r;
        const y = -Math.sin(angle) * r;
        if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
      }
      starShape.closePath();
      const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.18, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: 0.065, bevelThickness: 0.065 });
      starGeo.center();
      const pipStarMesh = addInkOutline(new THREE.Mesh(starGeo, yellowMat), 1.055);
      pipStarMesh.position.set(-0.18, 0.54, -0.08);
      pipGroup.add(pipStarMesh);
      scene.add(pipGroup);

      // Table & Sprout Group
      const tableGroup = new THREE.Group();
      tableGroup.position.set(0, 0.045, 0.36);
      const tableTop = addInkOutline(new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.13, 40), woodMat), 1.028);
      tableTop.scale.set(1.18, 1, 0.86); tableTop.position.y = 0.68;
      const sharedBun = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), bunMat), 1.055);
      sharedBun.scale.set(1.22, 0.76, 1.12); sharedBun.position.set(0.02, 0.92, -0.22);
      const sproutGroup = new THREE.Group();
      sproutGroup.position.set(0.58, 0.75, 0.18);
      const leafTray = addInkOutline(new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.42, 0.035, 24), greenMat), 1.05);
      leafTray.scale.set(1.32, 1, 0.88); leafTray.position.y = 0.018;
      const snailShell = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.21, 24, 20), greenMat), 1.06);
      snailShell.scale.set(1.05, 1.05, 0.75); snailShell.position.set(0.15, 0.25, 0);
      const sproutBerry = addInkOutline(new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 18), coralMat), 1.07);
      sproutBerry.scale.set(0.95, 1.15, 0.95); sproutBerry.position.set(-0.32, 0.16, 0.05);
      sproutGroup.add(leafTray, snailShell, sproutBerry);
      tableGroup.add(tableTop, sharedBun, sproutGroup);
      scene.add(tableGroup);

      // Window Group
      const windowGroup = new THREE.Group();
      windowGroup.position.set(0, 2.55, -2.05);
      const archOuter = addInkOutline(new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.11, 18, 40, Math.PI), woodMat), 1.04);
      const sill = addInkOutline(new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.15, 0.28), woodMat), 1.04);
      sill.position.y = -0.88;
      const skyBackdrop = new THREE.Mesh(new THREE.CircleGeometry(1.19, 36), new THREE.MeshStandardMaterial({ color: 0x22335e, roughness: 0.85 }));
      skyBackdrop.position.set(0, -0.14, -0.06);
      windowGroup.add(archOuter, sill, skyBackdrop);
      scene.add(windowGroup);

      const _camTargetPos = new THREE.Vector3();
      const _camLookTarget = new THREE.Vector3();
      const _scratchColor = new THREE.Color();

      function updateScene() {
        const exp = spreadPct / 100;
        misoGroup.position.x = -1.38 - exp * 0.85;
        plumGroup.position.x = 1.38 + exp * 0.85;
        pipGroup.position.z = 1.34 + exp * 0.65;
        windowGroup.position.z = -2.05 - exp * 0.85;
        sproutGroup.position.y = 0.75 + exp * 0.38;

        if (activeMood === "moonlight") {
          _scratchColor.setHex(0x221b33);
        } else if (activeMood === "afternoon") {
          _scratchColor.setHex(0x3a2e52);
        } else {
          _scratchColor.setHex(0x361f38);
        }
        scene.background.copy(_scratchColor);
        scene.fog.color.copy(_scratchColor);

        if (transitionActive) {
          const p = PRESET_INFO[activePreset] || PRESET_INFO.overview;
          camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
          controls.target.set(p.target[0], p.target[1], p.target[2]);
          transitionActive = false;
        }
        controls.update();
        renderer.render(scene, camera);
      }

      requestRenderFn = updateScene;
      controls.addEventListener("change", updateScene);
      window.addEventListener("resize", () => {
        if (threeModal.hidden) return;
        const w = threeMount.clientWidth || window.innerWidth;
        const h = threeMount.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        updateScene();
      });

      updateScene();
    }

    function open3DModal() {
      threeModal.hidden = false;
      initThreeScene();
      if (requestRenderFn) requestRenderFn();
    }

    function close3DModal() {
      threeModal.hidden = true;
    }

    open3DBtns.forEach((btn) => btn.addEventListener("click", open3DModal));
    if (close3DBtn) close3DBtn.addEventListener("click", close3DModal);
    if (threeColorBtn) {
      threeColorBtn.addEventListener("click", () => {
        close3DModal();
        const openStudioBtn = $("#open-studio");
        if (openStudioBtn) openStudioBtn.click();
      });
    }
    if (toggleDockBtn && bottomDock) {
      toggleDockBtn.addEventListener("click", () => {
        const collapsed = bottomDock.classList.toggle("is-collapsed");
        toggleDockBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        toggleDockBtn.textContent = collapsed ? "▴ Show Controls (H)" : "▾ Hide Controls (H)";
      });
    }
    camButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activePreset = btn.getAttribute("data-cam-preset") || "overview";
        transitionActive = true;
        camButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        syncCardUI(activePreset);
        if (requestRenderFn) requestRenderFn();
      });
    });
    moodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeMood = btn.getAttribute("data-light-mood") || "moonlight";
        moodButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        if (requestRenderFn) requestRenderFn();
      });
    });
    if (spreadInput) {
      spreadInput.addEventListener("input", () => {
        spreadPct = Number(spreadInput.value) || 0;
        if (spreadVal) spreadVal.textContent = spreadPct + "%";
        if (requestRenderFn) requestRenderFn();
      });
    }
  }

  syncSaved();
})();