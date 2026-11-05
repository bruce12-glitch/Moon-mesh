/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {
      colors: {
        ink: "#322f37",
        lavender: "#f8edff",
        cream: "#fbf7ee",
        rose: "#b55770",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        handwritten: ["Caveat", "cursive"],
      },
    },
  },
  plugins: [],
};
