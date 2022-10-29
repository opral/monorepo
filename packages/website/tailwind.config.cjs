const {
	colorSystem,
	components,
} = require("@inlang/design-system/tailwind-plugins");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		colorSystem.configure({}),
		components.configure({ borderRadius: "DEFAULT" }),
	],
	// safelist: ["bg-tertiary"],
};

/**
 * @typedef {["primary","secondary","tertiary","error"]} DesignSystemColors
 *
 * Colors are defined in the design system.
 *
 * Hardcoded for now. Implementation can be found in `design-system/src/color-system/tailwindPlugin.cts`
 */
