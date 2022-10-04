import type { tailwindThemeTokens } from "../utilities/tailwindThemeTokens.cjs";

export type ParsedConfig = {
	/**
	 * Returns a mapped version of the configured border radius.
	 *
	 * The DEFAULT radius provided by TailwindCSS might not be
	 * the "default" radius that should be applied. Someone might
	 * want a large "default" radius.
	 *
	 * _Example:_
	 * ```js
	 *      const config = {"borderRadiusDefault": "lg"}
	 *      borderRadius("DEFAULT")
	 *      >> "lg"
	 *      borderRadius("sm")
	 *      >> "DEFAULT"
	 * ```
	 */
	borderRadius: (
		size: "sm" | "DEFAULT" | "lg"
	) => typeof tailwindThemeTokens["borderRadius"][number];
};
