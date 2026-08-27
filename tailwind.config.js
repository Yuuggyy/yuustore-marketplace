/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // YuuStore brand colors
        background: "#040000",
        surface: "#191919",
        "surface-light": "#282828",
        accent: {
          DEFAULT: "#e59d02",
          hover: "#f5b32d",
          dark: "#c08800",
        },
        heading: "#ffffff",
        default: "#f8f8f8",
        muted: "#8a8a8a",
      },
      fontFamily: {
        display: ["Raleway", "system-ui", "sans-serif"],
        body: ["Roboto", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
