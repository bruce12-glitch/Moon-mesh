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
  const threeInlineMount = $("#three-inline-mount");
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
      pos: [0.35, 3.85, 7.35],
      target: [0, 1.15, 0.15],
      badge: "Storybook Cutaway Diorama",
      title: "The Little Moon Picnic · Ages 6–9",
      desc: "Drag to orbit or pick a character below! Miso, Pip, Plum, and Sprout share warm honey buns, berries, and coloring pages in their cozy garden attic nook."
    },
    miso: {
      pos: [-1.45, 2.15, 3.65],
      target: [-1.58, 1.28, 0.22],
      badge: "Cream Kitten · Scale 1.00",
      title: "Miso · The Daydreamer",
      desc: "Wearing her mustard-yellow scarf and sky-blue striped ear ribbon, Miso sips warm cocoa and colors a crescent moon page."
    },
    plum: {
      pos: [1.45, 2.15, 3.65],
      target: [1.58, 1.28, 0.22],
      badge: "Lavender Lop Bunny · Scale 0.95",
      title: "Plum · The Kind Heart",
      desc: "Tucked in her red strawberry beret cap and sky-blue collar bow, Plum holds fresh tulips and saves a cushion for you."
    },
    pip: {
      pos: [-0.95, 1.55, 3.25],
      target: [-0.95, 0.52, 1.48],
      badge: "Five-Point Star · Scale 0.45",
      title: "Pip · The Bright Idea",
      desc: "A cheerful butter-yellow star who hung the three paper moons in the window and guards the polka-dot bowl of picnic strawberries."
    },
    sprout: {
      pos: [0.68, 1.68, 2.15],
      target: [0.36, 0.78, 0.14],
      badge: "Garden Snail · Scale 0.30",
      title: "Sprout · The Slow-and-Steady",
      desc: "Perched on a heart-leaf coaster on the picnic table with two curious eye stalks and a coiled sage shell, admiring one prized strawberry."
    },
    window: {
      pos: [0, 2.95, 4.15],
      target: [0, 2.45, -1.95],
      badge: "3 Hanging Paper Moons",
      title: "Arched Crescent Window",
      desc: "Outside the honey-oak arch, a golden crescent moon glows between sleepy clouds while three handmade paper moons sway indoors."
    }
  };

  function mountCutawayDiorama(mountEl) {
    if (!mountEl || typeof THREE === "undefined") return null;

    const width = mountEl.clientWidth || 640;
    const height = mountEl.clientHeight || 420;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    mountEl.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#241B38");
    scene.fog = new THREE.FogExp2("#241B38", 0.022);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 80);
    camera.position.set(0.2, 4.1, 7.8);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minPolarAngle = 0.22;
    controls.minDistance = 2.4;
    controls.maxDistance = 13.5;
    controls.target.set(0, 1.35, -0.1);

    const createClayMat = (hex, opts = {}) =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex),
        roughness: opts.roughness ?? 0.48,
        metalness: 0.0,
        clearcoat: opts.clearcoat ?? 0.14,
        clearcoatRoughness: opts.clearcoatRoughness ?? 0.36,
        reflectivity: 0.25,
        emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color("#000000"),
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        map: opts.map ?? null
      });

    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#231715"),
      roughness: 0.08,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    });
    const blushMat = createClayMat("#FF8B9E", { roughness: 0.5 });
    const catchMat = new THREE.MeshBasicMaterial({ color: "#FFFFFF" });
    const mouthLineMat = createClayMat("#3A231E", { roughness: 0.4 });

    // Procedural gingham texture
    const createGinghamTexture = () => {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#FFF9F2";
      ctx.fillRect(0, 0, 512, 512);
      const step = 64;
      for (let y = 0; y < 512; y += step) {
        for (let x = 0; x < 512; x += step) {
          const isEvenX = (x / step) % 2 === 0;
          const isEvenY = (y / step) % 2 === 0;
          if (!isEvenX && !isEvenY) {
            ctx.fillStyle = "#F28B9C";
            ctx.fillRect(x, y, step, step);
          } else if (!isEvenX || !isEvenY) {
            ctx.fillStyle = "#FBD0D9";
            ctx.fillRect(x, y, step, step);
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2.5, 2.5);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const createWoodDeckTexture = () => {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#DFAD76";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) {
        const y = i * 64;
        ctx.fillStyle = i % 2 === 0 ? "#E3B37C" : "#D8A36C";
        ctx.fillRect(0, y, 512, 61);
        ctx.fillStyle = "#B8804A";
        ctx.fillRect(0, y + 61, 512, 3);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // 3-Point Toy Studio Lighting
    scene.add(new THREE.HemisphereLight("#FFF6EA", "#9A7BB5", 1.15));
    const keyLight = new THREE.DirectionalLight("#FFF3DE", 1.45);
    keyLight.position.set(5.5, 9.0, 6.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#E0C8FF", 0.68);
    fillLight.position.set(-6.0, 5.0, 4.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight("#FFD27D", 0.82);
    rimLight.position.set(0.0, 5.5, -5.5);
    scene.add(rimLight);

    // Floating Island Base
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    const subBase = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 2.75, 0.55, 64), createClayMat("#B9929F", { roughness: 0.65 }));
    subBase.position.y = -0.45;
    islandGroup.add(subBase);

    const meadowRim = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.48, 0.34, 64), createClayMat("#8CC67B", { roughness: 0.56 }));
    meadowRim.position.y = -0.08;
    islandGroup.add(meadowRim);

    const meadowLip = new THREE.Mesh(new THREE.TorusGeometry(3.52, 0.16, 20, 64), createClayMat("#9BD189", { roughness: 0.54 }));
    meadowLip.rotation.x = Math.PI / 2;
    meadowLip.position.y = 0.04;
    islandGroup.add(meadowLip);

    const woodDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.18, 0.14, 64), createClayMat("#FFFFFF", { map: createWoodDeckTexture(), roughness: 0.5 }));
    woodDeck.position.y = 0.1;
    islandGroup.add(woodDeck);

    const blanketMain = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.42, 0.06, 64), createClayMat("#FFFFFF", { map: createGinghamTexture(), roughness: 0.62, clearcoat: 0.04 }));
    blanketMain.position.set(0, 0.18, 0.18);
    islandGroup.add(blanketMain);

    // Cloud puffs
    const cloudMat = createClayMat("#F8F2FF", { roughness: 0.38, clearcoat: 0.2, emissive: "#4A3869", emissiveIntensity: 0.15 });
    [
      [-3.55, -0.18, 1.1, 0.56], [-3.15, -0.25, 1.85, 0.44], [-3.7, -0.2, 0.35, 0.48],
      [3.55, -0.18, 1.0, 0.54], [3.15, -0.24, 1.75, 0.42], [3.7, -0.22, 0.2, 0.48],
      [-2.7, -0.22, -2.5, 0.62], [2.6, -0.22, -2.5, 0.6], [0.0, -0.35, 3.65, 0.46]
    ].forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), cloudMat);
      puff.scale.set(1.22, 0.78, 1.05);
      puff.position.set(x, y, z);
      islandGroup.add(puff);
    });

    // Analytical Two-Circle 3D Crescent Moon
    const moonWindowGroup = new THREE.Group();
    scene.add(moonWindowGroup);

    const moonShape = new THREE.Shape();
    const R1 = 1.35, R2 = 1.15, d = 0.52;
    const xInt = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
    const yInt = Math.sqrt(Math.max(0, R1 * R1 - xInt * xInt));
    const theta1 = Math.atan2(yInt, xInt);
    const theta2 = Math.atan2(yInt, xInt - d);
    moonShape.absarc(0, 0, R1, theta1, Math.PI * 2 - theta1, false);
    moonShape.absarc(d, 0, R2, Math.PI * 2 - theta2, theta2, true);
    moonShape.closePath();

    const moonGeo = new THREE.ExtrudeGeometry(moonShape, {
      depth: 0.24, bevelEnabled: true, bevelSegments: 14, steps: 1, bevelSize: 0.14, bevelThickness: 0.18, curveSegments: 48
    });
    moonGeo.center();
    const crescentMoon = new THREE.Mesh(moonGeo, createClayMat("#FFD859", { roughness: 0.3, clearcoat: 0.35, emissive: "#F5B027", emissiveIntensity: 0.28 }));
    crescentMoon.scale.set(0.68, 0.68, 0.68);
    crescentMoon.position.set(-1.82, 2.58, -1.45);
    crescentMoon.rotation.z = -0.22;
    crescentMoon.rotation.y = 0.24;
    moonWindowGroup.add(crescentMoon);

    // Arched Cottage Window
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0.25, 1.85, -1.95);
    moonWindowGroup.add(windowGroup);

    const frameWoodMat = createClayMat("#B57642", { roughness: 0.5 });
    const skyGlassMat = new THREE.MeshBasicMaterial({ color: "#1B254B" });
    const skyCircle = new THREE.Mesh(new THREE.CircleGeometry(1.02, 40), skyGlassMat);
    skyCircle.position.set(0, 0.22, -0.04);
    windowGroup.add(skyCircle);
    const skyRect = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 1.05), skyGlassMat);
    skyRect.position.set(0, -0.3, -0.04);
    windowGroup.add(skyRect);

    const archFrame = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.12, 20, 48, Math.PI), frameWoodMat);
    archFrame.position.set(0, 0.22, 0);
    windowGroup.add(archFrame);
    [-1.04, 1.04].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.08, 20), frameWoodMat);
      pillar.position.set(px, -0.32, 0);
      windowGroup.add(pillar);
    });
    const vCross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.08, 16), frameWoodMat);
    vCross.position.set(0, 0.22, 0.02);
    windowGroup.add(vCross);
    const hCross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.04, 16), frameWoodMat);
    hCross.rotation.z = Math.PI / 2;
    hCross.position.set(0, 0.2, 0.02);
    windowGroup.add(hCross);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.18, 0.34), createClayMat("#965D2E", { roughness: 0.52 }));
    sill.position.set(0, -0.86, 0.04);
    windowGroup.add(sill);

    // Tufted Cushion & Kawaii Face helpers
    const createTuftedCushion = (radius, height, hex, buttonHex) => {
      const cGroup = new THREE.Group();
      const mat = createClayMat(hex, { roughness: 0.56 });
      cGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, height, 32), mat));
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI * 2) / 10;
        const lobe = new THREE.Mesh(new THREE.SphereGeometry(height * 0.72, 20, 20), mat);
        lobe.scale.set(1.25, 0.75, 1.35);
        lobe.position.set(Math.cos(ang) * radius * 0.76, 0, Math.sin(ang) * radius * 0.76);
        lobe.rotation.y = -ang;
        cGroup.add(lobe);
      }
      const btn = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.12, 14, 14), createClayMat(buttonHex, { roughness: 0.5 }));
      btn.scale.set(1, 0.45, 1); btn.position.y = height * 0.52;
      cGroup.add(btn);
      return cGroup;
    };

    const attachKawaiiFace = (headGroup, faceZ, eyeSpacing, eyeY, noseHex) => {
      [-1, 1].forEach((dir) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.086, 22, 22), eyeMat);
        eye.scale.set(0.95, 1.12, 0.58);
        eye.position.set(dir * eyeSpacing, eyeY, faceZ);
        headGroup.add(eye);

        const catchBig = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), catchMat);
        catchBig.position.set(dir * eyeSpacing - 0.022, eyeY + 0.032, faceZ + 0.046);
        headGroup.add(catchBig);

        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 18), blushMat);
        cheek.scale.set(1.3, 0.68, 0.35);
        cheek.position.set(dir * (eyeSpacing + 0.13), eyeY - 0.1, faceZ - 0.03);
        cheek.rotation.y = dir * 0.25;
        headGroup.add(cheek);
      });
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 16), createClayMat(noseHex, { roughness: 0.35 }));
      nose.scale.set(1.25, 0.85, 0.65);
      nose.position.set(0, eyeY - 0.055, faceZ + 0.04);
      headGroup.add(nose);

      [-1, 1].forEach((dir) => {
        const smile = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.013, 12, 24, Math.PI), mouthLineMat);
        smile.rotation.z = Math.PI;
        smile.position.set(dir * 0.044, eyeY - 0.085, faceZ + 0.035);
        headGroup.add(smile);
      });
    };

    // Miso (1.00)
    const misoGroup = new THREE.Group();
    misoGroup.position.set(-1.38, 0.21, 0.18);
    misoGroup.rotation.y = 0.56;
    scene.add(misoGroup);

    const misoCushion = createTuftedCushion(0.76, 0.22, "#F78C9B", "#FFE5EC");
    misoCushion.position.y = 0.11;
    misoGroup.add(misoCushion);

    const misoCreamMat = createClayMat("#FFF6E5", { roughness: 0.44, clearcoat: 0.16 });
    const misoCaramelMat = createClayMat("#E3A66B", { roughness: 0.46, clearcoat: 0.14 });
    const innerEarPinkMat = createClayMat("#F9B4C2", { roughness: 0.5 });

    const misoTorso = new THREE.Mesh(new THREE.SphereGeometry(0.58, 32, 32), misoCreamMat);
    misoTorso.scale.set(1.04, 0.94, 0.96);
    misoTorso.position.y = 0.66;
    misoGroup.add(misoTorso);

    const scarfMat = createClayMat("#F7BD45", { roughness: 0.52 });
    const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.125, 22, 42), scarfMat);
    scarfRing.rotation.x = Math.PI / 2 + 0.08;
    scarfRing.position.set(0, 1.04, 0.03);
    misoGroup.add(scarfRing);

    const misoHead = new THREE.Group();
    misoHead.position.set(0, 1.56, 0.04);
    misoGroup.add(misoHead);

    const misoHeadSphere = new THREE.Mesh(new THREE.SphereGeometry(0.68, 36, 36), misoCreamMat);
    misoHeadSphere.scale.set(1.16, 0.95, 1.04);
    misoHead.add(misoHeadSphere);

    [-1, 1].forEach((dir) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(dir * 0.48, 0.5, -0.02);
      earGroup.rotation.z = -dir * 0.42;
      const outerEar = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), dir === 1 ? misoCaramelMat : misoCreamMat);
      outerEar.scale.set(0.92, 1.22, 0.56);
      earGroup.add(outerEar);
      misoHead.add(earGroup);
    });

    const bowBlueMat = createClayMat("#74BEFA", { roughness: 0.36, clearcoat: 0.26 });
    const bowKnotMat = createClayMat("#4EA0E8", { roughness: 0.36, clearcoat: 0.26 });
    const bowGroup = new THREE.Group();
    bowGroup.position.set(-0.44, 0.52, 0.24);
    bowGroup.rotation.set(0.15, 0.28, 0.36);
    bowGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 18), bowKnotMat));
    [-1, 1].forEach((bDir) => {
      const loop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 22, 22), bowBlueMat);
      loop.scale.set(1.3, 0.85, 0.58);
      loop.position.set(bDir * 0.16, 0.02, -0.01);
      bowGroup.add(loop);
    });
    misoHead.add(bowGroup);
    attachKawaiiFace(misoHead, 0.67, 0.25, -0.03, "#F47B8E");

    // Plum (0.95)
    const plumGroup = new THREE.Group();
    plumGroup.position.set(1.38, 0.21, 0.18);
    plumGroup.rotation.y = -0.58;
    plumGroup.scale.setScalar(0.95);
    scene.add(plumGroup);

    const plumCushion = createTuftedCushion(0.76, 0.22, "#9AD493", "#FFF5E4");
    plumCushion.position.y = 0.11;
    plumGroup.add(plumCushion);

    const plumLavMat = createClayMat("#E4CEF7", { roughness: 0.44, clearcoat: 0.16 });
    const berryHoodMat = createClayMat("#F24B60", { roughness: 0.36, clearcoat: 0.28 });

    const plumTorso = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), plumLavMat);
    plumTorso.scale.set(1.04, 0.92, 0.96);
    plumTorso.position.y = 0.65;
    plumGroup.add(plumTorso);

    const plumHead = new THREE.Group();
    plumHead.position.set(0, 1.54, 0.04);
    plumGroup.add(plumHead);

    const plumHeadSphere = new THREE.Mesh(new THREE.SphereGeometry(0.66, 36, 36), plumLavMat);
    plumHeadSphere.scale.set(1.14, 0.94, 1.02);
    plumHead.add(plumHeadSphere);

    const hoodGroup = new THREE.Group();
    hoodGroup.rotation.x = -0.24;
    const hoodCap = new THREE.Mesh(new THREE.SphereGeometry(0.73, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.54), berryHoodMat);
    hoodCap.scale.set(1.14, 0.98, 1.06);
    hoodCap.position.y = 0.05;
    hoodGroup.add(hoodCap);
    plumHead.add(hoodGroup);

    [-1, 1].forEach((dir) => {
      const lopEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.54, 18, 24), plumLavMat);
      lopEar.scale.set(0.88, 1, 0.56);
      lopEar.position.set(dir * 0.68, -0.21, 0.06);
      lopEar.rotation.z = dir * 0.22;
      plumHead.add(lopEar);
    });
    attachKawaiiFace(plumHead, 0.64, 0.24, -0.05, "#D86B8E");

    // Pip (0.45)
    const pipGroup = new THREE.Group();
    pipGroup.position.set(-0.78, 0.21, 1.18);
    pipGroup.rotation.y = 0.36;
    scene.add(pipGroup);

    const pipCushion = createTuftedCushion(0.42, 0.14, "#FAD075", "#FFF8E8");
    pipCushion.position.y = 0.07;
    pipGroup.add(pipCushion);

    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.44 : 0.25;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(a) * r, y = -Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.14, bevelEnabled: true, bevelSegments: 12, steps: 1, bevelSize: 0.09, bevelThickness: 0.11 });
    starGeo.center();
    const pipStarMesh = new THREE.Mesh(starGeo, createClayMat("#FFE05D", { roughness: 0.34, clearcoat: 0.26, emissive: "#F5B82E", emissiveIntensity: 0.14 }));
    pipStarMesh.position.y = 0.52;
    pipGroup.add(pipStarMesh);

    // Table & Sprout (0.30)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0.21, 0.15);
    scene.add(tableGroup);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.11, 48), createClayMat("#E6B37A", { roughness: 0.42, clearcoat: 0.2 }));
    tableTop.position.y = 0.56;
    tableGroup.add(tableTop);

    const sproutGroup = new THREE.Group();
    sproutGroup.position.set(0.45, 0.62, 0.05);
    sproutGroup.rotation.y = -0.45;
    const leafPad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.035, 32), createClayMat("#78C268", { roughness: 0.5 }));
    leafPad.scale.set(1.22, 1, 0.88);
    leafPad.position.y = 0.018;
    const shellMain = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), createClayMat("#C87D4B", { roughness: 0.44 }));
    shellMain.position.set(0.06, 0.2, 0);
    sproutGroup.add(leafPad, shellMain);
    tableGroup.add(sproutGroup);

    function renderFrame(presetKey = "overview", moodKey = "afternoon", spreadPctVal = 0) {
      const exp = spreadPctVal / 100;
      misoGroup.position.x = -1.38 - exp * 0.55;
      plumGroup.position.x = 1.38 + exp * 0.55;
      pipGroup.position.z = 1.18 + exp * 0.45;
      sproutGroup.position.y = 0.62 + exp * 0.3;

      if (moodKey === "sunset") {
        scene.background.setHex(0x331f3d);
      } else if (moodKey === "afternoon") {
        scene.background.setHex(0x281e3f);
      } else {
        scene.background.setHex(0x1f1632);
      }

      if (presetKey) {
        const p = PRESET_INFO[presetKey] || PRESET_INFO.overview;
        camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
        controls.target.set(p.target[0], p.target[1], p.target[2]);
      }
      controls.update();
      renderer.render(scene, camera);
    }

    controls.addEventListener("change", () => renderer.render(scene, camera));
    window.addEventListener("resize", () => {
      const w = mountEl.clientWidth || 640;
      const h = mountEl.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    });

    renderFrame("overview", "afternoon", 0);
    return { renderFrame };
  }

  if (threeInlineMount) {
    mountCutawayDiorama(threeInlineMount);
  }

  if (threeModal && threeMount) {
    let activePreset = "overview";
    let activeMood = "afternoon";
    let spreadPct = 0;
    let modalInstance = null;

    function syncCardUI(presetKey) {
      const info = PRESET_INFO[presetKey] || PRESET_INFO.overview;
      if (cardBadgeEl) cardBadgeEl.textContent = info.badge;
      if (cardTitleEl) cardTitleEl.textContent = info.title;
      if (cardDescEl) cardDescEl.textContent = info.desc;
    }

    function open3DModal() {
      threeModal.hidden = false;
      if (!modalInstance) modalInstance = mountCutawayDiorama(threeMount);
      modalInstance.renderFrame(activePreset, activeMood, spreadPct);
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
        camButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        syncCardUI(activePreset);
        if (modalInstance) modalInstance.renderFrame(activePreset, activeMood, spreadPct);
      });
    });
    moodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeMood = btn.getAttribute("data-light-mood") || "afternoon";
        moodButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        if (modalInstance) modalInstance.renderFrame(null, activeMood, spreadPct);
      });
    });
    if (spreadInput) {
      spreadInput.addEventListener("input", () => {
        spreadPct = Number(spreadInput.value) || 0;
        if (spreadVal) spreadVal.textContent = spreadPct + "%";
        if (modalInstance) modalInstance.renderFrame(null, activeMood, spreadPct);
      });
    }
  }

  syncSaved();
})();