module.exports = {
  mode: "jit",
  // https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
  darkMode: "class",
  content: [
    "./components/**/*.js",
    "./components/**/*.tsx",
    "./nextra-theme-docs/**/*.js",
    "./nextra-theme-docs/**/*.tsx",
    "./nextra-theme-docs/**/*.css",
    "./pages/**/*.md",
    "./pages/**/*.mdx",
    "./pages/**/*.tsx",
    "./theme.config.js",
    "./styles/global.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [`"Inter"`, "sans-serif"],
        mono: [
          "Menlo",
          "Monaco",
          "Lucida Console",
          "Liberation Mono",
          "DejaVu Sans Mono",
          "Bitstream Vera Sans Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
};
