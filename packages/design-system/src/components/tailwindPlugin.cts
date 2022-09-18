import fs from "node:fs";
import { style } from "./button/button.style.cjs";
import plugin from "tailwindcss/plugin";
import css from "css";

/**
 * Entrypoint of the plugin.
 *
 * Nothing can be configured for now. The function exists for consistency
 * with the typography and color plugins and future-proofing of the component
 * plugin itself.
 */
export function configure() {
	return plugin(({ addComponents }) => {
		addComponents(style);
	});
}

/**
 * The tailwind utility classes used by the components.
 *
 * Use this function to safelist the classes used by the components. Tailwind
 * has no way to determine which classes are used otherwise and will likely
 * not include certain classes.
 */
export function usedUtilityClasses() {
	// read the tailwind generated stylesheet in ./dist (since the plugin
	// will only be executed when compiled and saved in dist, this works).
	//
	// using require.resolve to resolve the relative path in the node modules
	const cssFile = fs.readFileSync(require.resolve("./tailwind.css"), "utf8");
	const cssObject = css.parse(cssFile);
	const selectors = cssObject.stylesheet?.rules
		// @ts-ignore
		// comments have no selectors
		.filter((rule) => rule.selectors !== undefined)
		// @ts-ignore
		// a rule can have multiple selectors, give us all selectors in one array
		.flatMap((rule) => rule.selectors)
		// filter the selectors and only include classes
		.filter((selector: string) => selector.startsWith("."))
		.map((selector: string) => {
			// tailwind's `:hover` classes have the weird syntax
			// of `hover\:bg-blue-500:hover` the second hover is not
			// a tailwind class. Thus, the selector needs to be returned
			// without the second hover.
			const split = selector.split(":");
			let result: string;
			if (split.length === 3) {
				// `["hover\\", "bg-blue-500", "hover"]`
				// join the split together again, but only the first two elements
				result = split.slice(0, 2).join(":");
			} else {
				// nothing needs to be sliced
				result = selector;
			}
			// check for css escape like `hover\:bg-blue-500`
			if (result.includes("\\")) {
				// remove the css escape
				return result.split("\\").join("");
			}
			return result;
		});
	return selectors;
}
