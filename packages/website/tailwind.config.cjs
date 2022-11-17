// @ts-ignore remove ts-ignore once "moduleResolution" is switched to `node16` again
// see the tsconfig.json file
const { colorSystem, components } = require("@inlang/design-system");
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
		// no tailwind colors. use color system colors only. see below
		colors: {},
	},
	safelist: usedClassWithDynamicColor(),
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		components.configure(),
		// the colors align with shoelace's colors https://shoelace.style/tokens/color
		colorSystem.configure({
			accentColors: {
				primary: colors.sky,
				//! shoelace's secondary token is called neutral.
				secondary: colors.gray,
			},
			neutralColors: {
				neutral: colors.neutral,
				neutralVariant: colors.stone,
			},
			semanticColors: {
				success: colors.green,
				warning: colors.amber,
				danger: colors.red,
			},
			colorLevels: {
				base: 600,
				container: 200,
				onContainer: 900,
			},
		}),
	],
};

/**
 * @typedef {["primary","secondary","success","warning", "danger"]} DesignSystemColors
 *
 * colors that are defined in the tailwind config.
 */

/**
 * finds dynamic classes that need to be whitelisted for tailwind css
 */
function usedClassWithDynamicColor() {
	/** @type {DesignSystemColors} */
	const designSystemColors = [
		"primary",
		"secondary",
		"success",
		"warning",
		"danger",
	];
	let result = [];
	const fs = require("fs");
	const glob = require("fast-glob");
	const files = glob.sync("src/**/*.{js,ts,jsx,tsx}");
	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		// match everything with a `-` before string interpolation
		// like `bg-${props.color}` or `bg-on-${color}`
		const matches = content.match(/([\w|-]*-*\$\{(.)*color\})/g);
		if (matches) {
			// iterate all possible color class possibilities
			// and push them to result
			for (const match of matches) {
				// bg-${args.color} text-on-${args.color} hover:bg-hover-${args.color} active:bg-active-${args.color}
				const classes = match.split(" ");
				for (const c of classes) {
					result.push(
						...designSystemColors.map((color) => {
							const replace = c.replace(/\$\{(.)*\}/, color);
							return replace;
						})
					);
				}
			}
		}
	}
	// filter duplicates
	result = [...new Set(result)];
	// console.log(
	// 	"whitelisted the following dynamic color classes for tailwind css:",
	// 	result
	// );
	return result;
}
