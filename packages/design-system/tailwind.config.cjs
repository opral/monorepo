const colors = require("./dist/colors/tailwindPlugin.cjs");
const typography = require("./dist/typography/tailwindPlugin.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.ts"],
	theme: {},
	plugins: [colors.configure(colors.defaultConfig), typography.configure()],
	// safelist: colors.safeListTokens(),
	// safelisting color classes as they can't be known beforehand.
};
