const header = document.querySelector(".masthead");
const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

function setMenu(isOpen) {
  menu.setAttribute("aria-expanded", String(isOpen));
  nav.classList.toggle("is-open", isOpen);
}

header.classList.add("is-ready");
menu.hidden = false;
menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") === "false"));
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) setMenu(false);
});
header.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menu.focus();
  }
});

const bookDialog = document.querySelector("#book-dialog");
const previews = {
  "midnight-kittens-details": "Follow Miso over sleepy rooftops, past glowing lanterns, and up to a crescent moon. A quiet adventure for the last few minutes before bedtime.",
  "starlight-garden-details": "Help Miso water flowers that look like stars, say hello to a snail, and see what else grows after the sun goes down.",
  "pocket-sized-planet-details": "Climb aboard Miso’s little rocket for ringed planets, twisty comets, and a trip through space with your favorite crayons.",
};

function openBook(card) {
  const art = bookDialog.querySelector(".preview-art");
  const cover = card.querySelector(".cover").cloneNode(true);
  cover.querySelector("img").loading = "eager";
  cover.setAttribute("aria-hidden", "true");
  art.className = "preview-art " + card.classList[1];
  art.replaceChildren(cover);
  bookDialog.querySelector("#preview-title").textContent = card.querySelector("h3").textContent;
  bookDialog.querySelector("#preview-description").textContent = previews[card.querySelector("[data-preview]").dataset.preview];
  bookDialog.showModal();
}

document.querySelectorAll("[data-preview]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openBook(link.closest(".book-card"));
  });
});
document.querySelector("#preview-color").addEventListener("click", () => bookDialog.close());

const cards = [...document.querySelectorAll(".book-card")];
const books = cards.map((card) => ({
  id: card.id,
  title: card.querySelector("h3").textContent,
  theme: card.querySelector(".book-genre").textContent,
  keywords: previews[card.querySelector("[data-preview]").dataset.preview],
  image: card.querySelector(".cover img").getAttribute("src"),
  card,
}));
const bookIds = new Set(books.map((book) => book.id));
const bookStorageKey = "moon-mesh-saved-books";
let saved = new Set();
try {
  const stored = JSON.parse(localStorage.getItem(bookStorageKey));
  if (Array.isArray(stored)) saved = new Set(stored.filter((id) => bookIds.has(id)));
} catch {
  // Saving still works in memory when browser storage is unavailable.
}

const catalog = document.querySelector("#catalog-dialog");
const catalogTitle = catalog.querySelector("#catalog-title");
const catalogSearch = catalog.querySelector(".catalog-search");
const catalogInput = catalogSearch.querySelector("input");
const catalogStatus = catalog.querySelector(".catalog-status");
const catalogResults = catalog.querySelector(".catalog-results");
const savedTrigger = document.querySelector(".saved-trigger");
const savedCount = savedTrigger.querySelector(".saved-count");
const catalogPages = [
  { title: "Miso & the Moon", theme: "Free coloring page", href: "#color", image: "assets/miso-and-the-moon.svg", keywords: "free printable print pdf color online colouring download club" },
  { title: "Meet Miso and friends", theme: "Our story", href: "#story", image: "assets/moon-mark.svg", keywords: "kitten cat rabbit snail star crew characters" },
  { title: "Frequently asked questions", theme: "Good to know", href: "#faq", image: "assets/moon-mark.svg", keywords: "help parents ages books printing buy" },
];
let catalogMode = "search";

function syncSaved() {
  savedCount.textContent = String(saved.size);
  savedTrigger.setAttribute("aria-label", saved.size ? "Saved books, " + saved.size : "Saved books");
  books.forEach((book) => {
    const button = book.card.querySelector(".book-save");
    const isSaved = saved.has(book.id);
    button.setAttribute("aria-pressed", String(isSaved));
  });
}

books.forEach((book) => {
  const button = book.card.querySelector(".book-save");
  button.hidden = false;
  button.addEventListener("click", () => {
    if (saved.has(book.id)) saved.delete(book.id);
    else saved.add(book.id);
    try {
      localStorage.setItem(bookStorageKey, JSON.stringify([...saved]));
    } catch {
      // Keep the current selection for this visit.
    }
    syncSaved();
  });
});
syncSaved();

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
  const results = isSaved ? books.filter((book) => saved.has(book.id)) : [...books, ...catalogPages].filter((item) => {
    const text = [item.title, item.theme, item.keywords].join(" ").toLowerCase();
    return tokens.every((token) => text.includes(token));
  });
  catalogResults.replaceChildren(...results.map(makeCatalogResult));
  if (isSaved) {
    catalogStatus.textContent = results.length ? "Saved in this browser." : "Tap a heart on a book to save it here.";
  } else {
    catalogStatus.textContent = results.length
      ? query ? results.length + (results.length === 1 ? " match" : " matches") : "Explore books, free pages, and more."
      : "No matches. Try a word like “moon,” “space,” or “printable.”";
  }
}

document.querySelectorAll("[data-catalog]").forEach((trigger) => {
  trigger.hidden = false;
  trigger.addEventListener("click", () => {
    catalogMode = trigger.dataset.catalog;
    catalogInput.value = "";
    catalogTitle.textContent = catalogMode === "saved" ? "Saved books" : "Find a book or page";
    catalogSearch.hidden = catalogMode === "saved";
    renderCatalog();
    catalog.showModal();
    if (!catalogSearch.hidden) catalogInput.focus();
  });
});
catalogInput.addEventListener("input", renderCatalog);

const welcome = document.querySelector(".welcome");
const crewToggle = welcome.querySelector(".crew-toggle");
welcome.classList.add("is-ready");
crewToggle.hidden = false;
crewToggle.addEventListener("click", () => {
  const isColored = welcome.classList.toggle("is-colored");
  crewToggle.setAttribute("aria-pressed", String(isColored));
});

const giftTab = document.querySelector(".gift-tab");
const giftKey = "moon-mesh-free-page-shortcut-dismissed";
let giftDismissed = false;
try {
  giftDismissed = sessionStorage.getItem(giftKey) === "yes";
} catch {
  // The shortcut can still be dismissed for this page.
}
if (!giftDismissed) {
  const hero = document.querySelector(".hero");
  const coloring = document.querySelector("#color");
  let pastHero = false;
  let coloringVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target === hero) pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
      if (entry.target === coloring) coloringVisible = entry.isIntersecting;
    });
    giftTab.hidden = !pastHero || coloringVisible;
  });
  observer.observe(hero);
  observer.observe(coloring);
  giftTab.querySelector("button").addEventListener("click", () => {
    observer.disconnect();
    giftTab.hidden = true;
    try {
      sessionStorage.setItem(giftKey, "yes");
    } catch {
      // Dismissal still applies until this page is closed.
    }
  });
}

const studio = document.querySelector("#color-dialog");
const openStudio = document.querySelector("#open-studio");
const canvas = document.querySelector("#color-canvas");
const palette = document.querySelector(".palette");
const reset = document.querySelector("#reset-color");
const status = document.querySelector("#studio-status");
let swatch = palette.querySelector('[aria-pressed="true"]');

openStudio.hidden = false;
openStudio.addEventListener("click", async () => {
  studio.showModal();
  if (canvas.querySelector("svg")) return;

  canvas.textContent = "Getting Miso’s page ready…";
  canvas.setAttribute("aria-busy", "true");
  try {
    const response = await fetch("assets/miso-and-the-moon.svg");
    if (!response.ok) throw new Error("Coloring page unavailable");
    const svg = new DOMParser().parseFromString(await response.text(), "image/svg+xml").documentElement;
    if (svg.localName !== "svg") throw new Error("Coloring page could not be read");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Miso and the Moon coloring shapes");
    svg.querySelectorAll("[data-part]").forEach((part) => {
      part.setAttribute("tabindex", "0");
      part.setAttribute("role", "button");
      part.setAttribute("aria-label", part.dataset.part);
    });
    canvas.replaceChildren(svg);
  } catch {
    canvas.textContent = "The coloring page couldn’t load. Open the studio again to retry, or download the blank page below.";
  } finally {
    canvas.removeAttribute("aria-busy");
  }
});

palette.addEventListener("click", (event) => {
  const selected = event.target.closest("[data-color]");
  if (!selected) return;
  swatch.setAttribute("aria-pressed", "false");
  swatch = selected;
  swatch.setAttribute("aria-pressed", "true");
});

function colorPart(part) {
  part.style.fill = swatch.dataset.color;
  const name = swatch.getAttribute("aria-label");
  const isEraser = swatch.dataset.color === "#fff";
  part.setAttribute("aria-label", isEraser ? part.dataset.part : part.dataset.part + ", " + name);
  status.textContent = isEraser ? part.dataset.part + " erased." : part.dataset.part + " colored " + name.toLowerCase() + ".";
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
  canvas.querySelectorAll("[data-part]").forEach((part) => {
    part.style.removeProperty("fill");
    part.setAttribute("aria-label", part.dataset.part);
  });
  status.textContent = "Coloring page cleared.";
  swatch.focus();
  reset.disabled = true;
});
