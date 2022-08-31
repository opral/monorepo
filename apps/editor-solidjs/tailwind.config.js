const colorSystem = require("@pankow-ui/color-system");
const typography = require("@pankow-ui/typography");
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./renderer/**/*.tsx", "./pages/**/*.tsx", "./pages/**/*.css"],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
    colorSystem.withConfig({
      // based on shoelace
      accentColors: { primary: colors.sky },
      neutralColors: {},
      semanticColors: {
        success: colors.green,
        warning: colors.amber,
        danger: colors.red,
      },
    }),
  ],
};
