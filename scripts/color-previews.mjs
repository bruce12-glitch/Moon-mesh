import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Paint the existing SVG contours, then keep the original ink above them.
// The outline and colored illustrations share exactly the same geometry.
const palette = {
  cream: "#FFF5DF", pink: "#F5A6A5", yellow: "#F6D66B",
  coral: "#E8867E", green: "#98B285", lilac: "#D8C8E9",
  blue: "#C8DFEC", mint: "#CEE0C1", tea: "#A67A5E", roof: "#D7AB98",
};
const pages = {
  rooftop: {
    4: "yellow", 5: "lilac", 6: "coral", 9: "yellow", 12: "cream",
    14: "coral", 15: "pink", 17: "pink", 19: "yellow", 20: "yellow",
    21: "yellow", 22: "yellow", 23: "yellow", 24: "yellow", 26: "yellow",
    27: "yellow", 28: "cream", 29: "green", 33: "yellow", 34: "yellow",
    35: "green", 36: "cream", 37: "cream", 38: "cream", 39: "green",
    40: "lilac", 41: "tea", 42: "yellow", 44: "cream", 45: "cream",
    46: "green", 47: "green", 48: "yellow", 49: "yellow", 50: "coral",
    51: "coral", 52: "yellow", 53: "yellow", 55: "green", 58: "roof",
    59: "coral", 60: "roof", 61: "roof", 62: "coral",
  },
  garden: {
    1: "yellow", 3: "cream", 5: "pink", 7: "pink", 12: "green",
    13: "cream", 14: "yellow", 18: "yellow", 19: "yellow", 20: "cream",
    21: "green", 22: "cream", 23: "cream", 24: "mint", 25: "cream",
    26: "green", 29: "mint", 31: "blue", 32: "blue", 35: "green",
    37: "blue", 38: "blue", 39: "blue", 40: "blue", 43: "pink",
    44: "lilac", 46: "green", 48: "coral", 49: "yellow", 50: "yellow",
    51: "yellow", 52: "yellow", 53: "green", 54: "yellow", 55: "yellow",
    56: "green", 57: "green", 58: "green", 60: "green", 61: "green",
    63: "green", 64: "green",
  },
  rocket: {
    2: "lilac", 3: "coral", 4: "yellow", 6: "cream", 7: "coral",
    8: "yellow", 9: "lilac", 10: "blue", 12: "blue", 13: "cream",
    17: "coral", 19: "yellow", 21: "yellow", 22: "blue", 24: "yellow",
    28: "cream", 29: "cream", 30: "blue", 31: "yellow", 32: "yellow",
    33: "blue", 34: "yellow", 35: "yellow", 36: "coral", 37: "yellow",
    38: "lilac",
  },
};

for (const [name, colors] of Object.entries(pages)) {
  const source = new URL(`../assets/${name}-coloring.svg`, import.meta.url);
  const svg = readFileSync(source, "utf8");
  const ink = svg.match(/<path[^>]*\sd="([^"]+)"[^>]*\/>/);
  if (!ink) throw new Error(`Missing ink path: ${name}`);
  const contours = ink[1].match(/M[^M]+/g);
  const fills = Object.entries(colors).map(([index, color]) => {
    if (!contours[index] || !palette[color]) throw new Error(`Invalid region: ${name}/${index}`);
    return `    <path fill="${palette[color]}" d="${contours[index].trim()}"/>`;
  }).join("\n");
  const colored = svg
    .replace(" coloring page</title>", " in color</title>")
    .replace(ink[0], `<g aria-hidden="true">\n${fills}\n  </g>\n  ${ink[0]}`);
  const output = new URL(`../assets/${name}-colored.svg`, import.meta.url);
  writeFileSync(output, colored);
  console.log(`Created ${fileURLToPath(output)}`);
}
