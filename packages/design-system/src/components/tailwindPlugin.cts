import fs from "node:fs";
import { style } from "./button/button.style.cjs";
import plugin from "tailwindcss/plugin";

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
export function usedUtilityClasses(): string[] {
	// read the tailwind generated stylesheet in ./dist (since the plugin
	// will only be executed when compiled and saved in dist, this works).
	//
	// using require.resolve to resolve the relative path in the node modules
	const css = fs.readFileSync(require.resolve("./style.css"), "utf8");
	// match classes in the stylesheet.
	const result = [...css.matchAll(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*\s*\{/g)!].map(
		// the match returns an array of arrays.
		// the first element is the class name
		// and returns a list like `['.mr-2 {', '.mb-2 {', '.rounded {', ...]`
		// slice is used to get rid of the ` {`.
		(match) => match[0].slice(0, -2)
	);
	return result;
}
