/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Google-style palette
        "google-blue": "#1a73e8",
        "google-blue-dark": "#174ea6",
        "google-red": "#ea4335",
        "google-yellow": "#fbbc04",
        "google-green": "#34a853",
        "google-grey": {
          50: "#f8f9fa",
          100: "#f1f3f4",
          200: "#e8eaed",
          300: "#dadce0",
          600: "#5f6368",
          900: "#202124",
        },
      },
      fontFamily: {
        sans: ["Google Sans", "Roboto", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        google: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        "google-hover": "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
      },
    },
  },
  plugins: [],
};
