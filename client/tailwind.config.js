/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9f1ff",
          200: "#bfe7ff",
          300: "#8ed7ff",
          400: "#58befe",
          500: "#249cff",
          600: "#0c7ae6",
          700: "#0f63c5",
          800: "#134fa3",
          900: "#17437f",
        },
        sunrise: {
          50: "#fffaf0",
          100: "#fff0d1",
          200: "#fddca2",
          300: "#f9c56d",
          400: "#f5aa36",
          500: "#ee8a1a",
          600: "#cf6d0c",
        },
        forest: {
          50: "#eefaf6",
          100: "#d8f4eb",
          200: "#b6e8dc",
          300: "#82d3bb",
          400: "#4bb79a",
          500: "#2b9a81",
          600: "#187b67",
        },
        night: {
          950: "#0b1220",
        },
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
        glow: "0 20px 40px rgba(37, 99, 235, 0.18)",
      },
      backgroundImage: {
        "hero-grid": "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
