/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore remove ts-ignore once "moduleResolution" is switched to `node16` again
// see the tsconfig.json file
const { colorSystem, components } = require("@inlang/design-system")
const colors = require("tailwindcss/colors")
const path = require("node:path")

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [path.join(__dirname, "./**/*.{js,ts,jsx,tsx}")],
	theme: {
		extend: {
			keyframes: {
				slideIn: {
					"0%": { transform: "translate(-150px, 64px)" },
					"75%": { transform: "translate(-150px, -8px)" },
					"100%": { transform: "translate(-150px, 0)" },
				},
				jump: {
					"0%": { transform: "translate(-150px, 0px)" },
					"50%": { transform: "translate(-150px, -16px)" },
					"100%": { transform: "translate(-150px, 0px)" },
				},
			},
			animation: {
				slideIn: "slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1",
				jump: "jump 0.3s ease 1",
			},
		},
		// no tailwind colors. use color system colors only. see below
		colors: {},
	},
	safelist: usedClassWithDynamicColor(),
	plugins: [
		require("@tailwindcss/aspect-ratio"),
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		components.configure(),
		//the colors align with shoelace's colors https://shoelace.style/tokens/color
		colorSystem.configure({
			//! the colors must satisfy the defined types below the config
			accentColors: {
				primary: colors.cyan,
				//! shoelace's secondary token is called neutral.
				secondary: colors.slate,
				tertiary: colors.lime,
			},
			neutralColors: {
				neutral: colors.slate,
				neutralVariant: colors.zinc,
			},
			semanticColors: {
				// duplicate primary color for better semantic meaning
				info: colors.slate,
				success: colors.green,
				warning: colors.amber,
				danger: colors.red,
			},
			colorLevels: {
				base: 600,
				container: 200,
				onContainer: 900,
				onInvertedContainer: 400,
			},
		}),
	],
}

/**
 * Color Tokens used in the design system.
 *
 * @typedef {[...AccentColorTokens, ...SemanticColorTokens]} ColorTokens
 */

/**
 * Semantic colors used in the design system.
 * https://m3.material.io/styles/color/the-color-system/key-colors-tones
 *
 * @typedef {["info", "success", "warning", "danger"]} SemanticColorTokens
 */

/**
 * Accent colors used in the design system.
 * https://m3.material.io/styles/color/the-color-system/key-colors-tones#a0d0c095-7068-46b3-bb67-28bc64d69f17
 *
 * @typedef {["primary","secondary", "tertiary"]} AccentColorTokens
 */

/**
 * finds dynamic classes that need to be whitelisted for tailwind css
 */
function usedClassWithDynamicColor() {
	/** @type {ColorTokens} */
	const colorTokens = ["primary", "secondary", "tertiary", "info", "success", "warning", "danger"]
	let result = []
	const fs = require("node:fs")
	const glob = require("fast-glob")
	const files = glob.sync("src/**/*.{js,ts,jsx,tsx}")
	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8")
		// match everything with a `-` before string interpolation
		// and after string interpolation with a `-`
		// must contain the world color or variant
		// like `bg-${props.color}` or `bg-on-${color}-container`
		const matches = content.match(/([\w|-]*-*\$\{(.)*(color|variant)\}[-|\w]*)/g)
		if (matches) {
			// iterate all possible color class possibilities
			// and push them to result
			for (const match of matches) {
				// bg-${args.color} text-on-${args.color} hover:bg-hover-${args.color} active:bg-active-${args.color}
				const classes = match.split(" ")
				for (const c of classes) {
					result.push(
						...colorTokens.map((token) => {
							const replace = c.replace(/\$\{(.)*\}/, token)
							return replace
						}),
					)
				}
			}
		}
	}
	// filter duplicates
	// result = [...new Set(result)]
	// console.log("whitelisted the following dynamic color classes for tailwind css:", result)
	return result
}
