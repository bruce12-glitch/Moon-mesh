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


  /* --------------------------------------------------- 3D Moon Picnic Modal */
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

  if (threeModal && threeMount) {
    let activePreset = "overview";
    let activeMood = "moonlight";
    let spreadPct = 0;
    let orbitYaw = 0;
    let orbitPitch = 0.25;
    let isDragging3D = false;
    let lastX = 0;
    let lastY = 0;
    let raf3D = 0;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    threeMount.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    function drawDiorama() {
      if (threeModal.hidden || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = threeMount.clientWidth || window.innerWidth;
      const h = threeMount.clientHeight || window.innerHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      const bgColors = {
        moonlight: ["#1d162b", "#2e2444"],
        afternoon: ["#372c4d", "#51426d"],
        sunset: ["#331d32", "#542f49"]
      };
      const [bgTop, bgBot] = bgColors[activeMood] || bgColors.moonlight;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2 + Math.sin(orbitYaw) * 90 + (activePreset === "miso" ? 80 : activePreset === "sprout" ? -65 : 0);
      const cy = h * 0.54 + (orbitPitch - 0.25) * 80 + (activePreset === "window" ? 95 : 0);
      const zoom = activePreset === "overview" ? 1 : 1.24;
      const spread = (spreadPct / 100) * 65;

      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      const winY = -180 - spread * 0.6;
      ctx.fillStyle = "#324573";
      ctx.strokeStyle = "#b98556";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(0, winY, 88, Math.PI, 0, false);
      ctx.lineTo(88, winY + 55);
      ctx.lineTo(-88, winY + 55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f5c95d";
      ctx.beginPath();
      ctx.arc(-22, winY - 8, 34, 0.3, Math.PI * 1.7);
      ctx.arc(-6, winY - 8, 25, Math.PI * 1.6, 0.4, true);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fffdf7";
      ctx.strokeStyle = "#cbbce0";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 82, 290, 92, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const misoX = -145 - spread;
      ctx.fillStyle = "#d87977";
      ctx.beginPath();
      ctx.ellipse(misoX, 82, 62, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4db";
      ctx.strokeStyle = "#2c2523";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(misoX, 34, 48, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(misoX, -32, 54, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f5c95d";
      ctx.fillRect(misoX - 38, -2, 76, 16);

      const plumX = 145 + spread;
      ctx.fillStyle = "#9db780";
      ctx.beginPath();
      ctx.ellipse(plumX, 82, 62, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#cbbce0";
      ctx.beginPath();
      ctx.ellipse(plumX, 36, 46, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(plumX, -28, 50, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#b98556";
      ctx.beginPath();
      ctx.ellipse(0, 38, 125, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#9db780";
      ctx.beginPath();
      ctx.arc(46, 20 - spread * 0.4, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d87977";
      ctx.beginPath();
      ctx.arc(18, 26 - spread * 0.4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const pipX = -95 - spread * 0.5;
      const pipY = 92 + spread * 0.4;
      ctx.fillStyle = "#f5c95d";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 32 : 16;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const px = pipX + Math.cos(a) * r;
        const py = pipY + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function open3DModal() {
      threeModal.hidden = false;
      drawDiorama();
    }

    function close3DModal() {
      threeModal.hidden = true;
      cancelAnimationFrame(raf3D);
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
        drawDiorama();
      });
    });
    moodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeMood = btn.getAttribute("data-light-mood") || "moonlight";
        moodButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        drawDiorama();
      });
    });
    if (spreadInput) {
      spreadInput.addEventListener("input", () => {
        spreadPct = Number(spreadInput.value) || 0;
        if (spreadVal) spreadVal.textContent = spreadPct + "%";
        drawDiorama();
      });
    }
    canvas.addEventListener("pointerdown", (e) => {
      isDragging3D = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener("pointermove", (e) => {
      if (!isDragging3D || threeModal.hidden) return;
      orbitYaw += (e.clientX - lastX) * 0.008;
      orbitPitch = Math.max(-0.4, Math.min(0.8, orbitPitch + (e.clientY - lastY) * 0.006));
      lastX = e.clientX;
      lastY = e.clientY;
      drawDiorama();
    });
    window.addEventListener("pointerup", () => {
      isDragging3D = false;
    });
    window.addEventListener("resize", () => {
      if (!threeModal.hidden) drawDiorama();
    });
  }

  syncSaved();
})();
