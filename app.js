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

document.querySelectorAll("[data-preview]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const card = link.closest(".book-card");
    const art = bookDialog.querySelector(".preview-art");
    const cover = card.querySelector(".cover").cloneNode(true);
    cover.querySelector("img").loading = "eager";
    cover.setAttribute("aria-hidden", "true");
    art.className = "preview-art " + card.classList[1];
    art.replaceChildren(cover);
    bookDialog.querySelector("#preview-title").textContent = card.querySelector("h3").textContent;
    bookDialog.querySelector("#preview-description").textContent = previews[link.dataset.preview];
    bookDialog.showModal();
  });
});
document.querySelector("#preview-color").addEventListener("click", () => bookDialog.close());

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
