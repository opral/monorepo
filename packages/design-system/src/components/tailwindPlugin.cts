import { GENERATED_TOKENS } from "../colors/tailwindPlugin.cjs";
import fs from "node:fs";

/**
 * The classes used by the web components.
 *
 * Use this function to safelist the classes used by the components. Tailwind
 * has no way to determine which classes are used otherwise and will likely
 * not include certain classes.
 */
export function usedClasses(): string[] {
	const colorClasses = safeListColorClasses();
	const tailwindDetectedClasses = fs.readFileSync("./style.css", "utf8");
	console.log(tailwindDetectedClasses);
	return colorClasses;
}

/**
 * Safelisting color classes is required as the used classes
 * are unknown before the runtime.
 *
 * The function returns  a list of color classes like
 * `['bg-primary', 'text-on-primary', ...]`
 * The implemenation is naive: All tailwind color prefixes are included,
 * leading to roughly 1000 classes with the default config that includes
 * ≈10 colors.
 */
function safeListColorClasses() {
	if (GENERATED_TOKENS === undefined) {
		const message =
			"Error: The `withConfig` function must be ran before calling `safeListTokens` in the tailwind config file!";
		// increasing the emphasization of the error message with line breaks
		console.error("\n\n", message, "\n\n");
		throw message;
	}
	// generate all color related tailwind classes form one token
	// `flatMap` = merge all classes into one list (instead of a list of lists)
	return Object.keys(GENERATED_TOKENS).flatMap((token) => [
		`text-${token}`,
		`bg-${token}`,
		`decoration-${token}`,
		`ring-offset-${token}`,
		`ring-${token}`,
		`outline-${token}`,
		`divide-${token}`,
		`border-${token}`,
	]);
}
