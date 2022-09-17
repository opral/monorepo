const { colors, typography, components } = require("./dist/index.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.ts"],
	theme: {},
	plugins: [
		colors.configure(colors.defaultConfig),
		typography.configure(),
		components.configure(),
	],
	// !safelisting is not required in the design system itself!
	// the used utility classes are extracted by the tailwind cli.
	// the `usedUtilityClasses()` function uses the generated css to derive
	// the used utility classes.
	//
	// TLDR if you enable the next line, tailwind will crash
	// because no style.css exists
	// safelist: components.usedUtilityClasses(),
};
