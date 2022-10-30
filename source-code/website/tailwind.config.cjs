const { colorSystem, components } = require("@inlang/design-system");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		colorSystem.configure(),
		components.configure(),
	],
};

/**
 * @typedef {["primary","secondary","tertiary","error"]} DesignSystemColors
 *
 * (Component) colors that are defined in the design system.
 *
 * Hardcoded for now. Implementation can be found in `design-system/src/color-system/tailwindPlugin.cts`
 */
