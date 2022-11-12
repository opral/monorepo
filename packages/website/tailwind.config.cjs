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
	safelist: usedClassWithDynamicColor(),
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

/**
 * finds dynamic classes that need to be whitelisted for tailwind css
 */
function usedClassWithDynamicColor() {
	const designSystemColors = ["primary", "secondary", "tertiary", "error"];
	const result = [];
	const fs = require("fs");
	const glob = require("fast-glob");
	const files = glob.sync("src/**/*.{js,ts,jsx,tsx}");
	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		// match everything with a `-` before string interpolation
		// like `bg-${props.color}` or `bg-on-${color}`
		const matches = content.match(/([\w|-]*-*\$\{(props.color|color)\})/g);
		if (matches) {
			// iterate all possible color class possibilities
			// and push them to result
			for (const match of matches) {
				if (match.includes("props.color")) {
					result.push(
						...designSystemColors.map((color) =>
							match.replace("${props.color}", color)
						)
					);
				} else {
					result.push(
						...designSystemColors.map((color) =>
							match.replace("${color}", color)
						)
					);
				}
			}
		}
	}
	console.log(
		"whitelisted the following dynamic color classes for tailwind css:",
		result
	);
}
