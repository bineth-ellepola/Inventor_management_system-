/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#15181D",
          900: "#1C2128",
          800: "#252B33",
          700: "#333B46",
          600: "#4A5563",
        },
        paper: {
          DEFAULT: "#F6F4EE",
          dim: "#EDEAE0",
        },
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C9862A",
        },
        slateblue: "#3E5C76",
        approved: "#3F7D5C",
        rejected: "#B23A2E",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
