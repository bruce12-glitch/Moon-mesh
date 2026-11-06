(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const masthead = $(".masthead");
  if (masthead) masthead.classList.add("is-ready");

  // Reveal controls that need JavaScript. Without JS the content stays readable.
  $$("[data-catalog]").forEach((trigger) => { trigger.hidden = false; });
  $$(".book-save").forEach((button) => { button.hidden = false; });
  const openStudioButton = $("#open-studio");
  if (openStudioButton) openStudioButton.hidden = false;

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
  const bookFilters = $(".book-filters");
  if (bookFilters) {
    bookFilters.hidden = false;
    bookFilters.addEventListener("click", (event) => {
      const selected = event.target.closest("[data-filter]");
      if (!selected) return;
      const filter = selected.dataset.filter;
      $$("[data-filter]", bookFilters).forEach((button) => {
        button.setAttribute("aria-pressed", String(button === selected));
      });
      bookCards.forEach((card) => { card.hidden = filter !== "all" && card.id !== filter; });
      $(".book-grid").classList.toggle("is-filtered", filter !== "all");
      const count = bookCards.filter((card) => !card.hidden).length;
      $("#filter-status").textContent = count + (count === 1 ? " adventure" : " adventures") + " on the bookshelf.";
    });
  }

  /* -------------------------------------------------------- Coloring film */

  const coloringVideo = $("#coloring-video");
  const videoPlay = $(".video-play");
  if (coloringVideo && videoPlay) {
    videoPlay.hidden = false;
    videoPlay.addEventListener("click", async () => {
      try {
        await coloringVideo.play();
      } catch {
        $(".video-status").textContent = "The video couldn’t start. Try the video controls.";
      }
    });
    coloringVideo.addEventListener("play", () => {
      if (document.activeElement === videoPlay) coloringVideo.focus({ preventScroll: true });
      videoPlay.hidden = true;
      $(".video-status").textContent = "";
    });
    coloringVideo.addEventListener("pause", () => { videoPlay.hidden = false; });
    coloringVideo.addEventListener("ended", () => { videoPlay.hidden = false; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) coloringVideo.pause();
    });
  }

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
      image: "assets/moon-mark.svg",
      keywords: "help parents ages printing buy purchase questions faq",
    },
    {
      title: "Moon Mail",
      theme: "A little letter",
      href: "#moon-mail",
      image: "assets/moon-mark.svg",
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
    const thumbnail = $(".peek-paper img", card);
    thumbnail.src = image;
    thumbnail.alt = peekImage.alt;
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
    crewToggle.addEventListener("click", () => {
      const showColor = crewToggle.getAttribute("aria-pressed") !== "true";
      crewToggle.setAttribute("aria-pressed", String(showColor));
      crewToggle.setAttribute("aria-label", showColor ? "Show Miso and friends as a drawing" : "Show Miso and friends in color");
      crew.classList.toggle("is-colored", showColor);
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
    navObserver.observe($(".hero"));
  }

  syncSaved();
})();
