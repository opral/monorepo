const { colorSystem, components } = require("@inlang/design-system");
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
		// no tailwind colors. use design system colors
		colors: {},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		components.configure(),
		colorSystem.configure({
			accentColors: {
				primary: colors.orange,
				secondary: colors.gray,
				tertiary: colors.teal,
			},
			semanticColors: {
				error: colors.red,
			},
		}),
	],
};

/**
 * @typedef {["primary","secondary","tertiary","error"]} DesignSystemColors
 *
 * (Component) colors that are defined in the design system.
 *
 * Hardcoded for now. Implementation can be found in `design-system/src/color-system/tailwindPlugin.cts`
 */
