import type { tailwindThemeTokens } from "../utilities/tailwindThemeTokens.cjs";

export type Config = {
	/**
	 * Default border radius.
	 *
	 * If no border radius is desired, set to `none`.
	 *
	 * `sm` and `3xl` can not be selected as they break
	 * the `sm, DEFAULT, lg` pattern. default sm border radius
	 * would apply border radius none otherwise.
	 */
	borderRadius: Exclude<
		typeof tailwindThemeTokens["borderRadius"][number],
		"sm" | "3xl"
	>;
};
