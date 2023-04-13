import plugin from "tailwindcss/plugin"
import link from "./link/index.cjs"

/**
 * Use this plugin if you want styled components.
 *
 * Nothing can be configured for now. The function exists for future-proofing of the
 * plugin.
 */
export function configure() {
	// const parsedConfig = parseConfig(config ?? {});
	return plugin(({ addComponents }) => {
		for (const component of [link]) {
			addComponents(component())
		}
	})
}

/**
 * !----------------------------------------
 * ! Everything below is subject for removal.
 * !
 * ! The intention of parsing a component config
 * ! were CSS component classes like `.button` that
 * ! could be configured with the config. But, too
 * ! much overhead right now.
 * !----------------------------------------
 */

/**
 * @deprecated (Maybe) No tailwind component classes use the config
 */
type Config = {
	/**
	 * Default border radius.
	 *
	 * If no border radius is desired, set to `none`.
	 *
	 * `sm` and `3xl` can not be selected as they break
	 * the `sm, DEFAULT, lg` pattern. default sm border radius
	 * would apply border radius none otherwise.
	 */
	borderRadius: Exclude<(typeof tailwindThemeTokens)["borderRadius"][number], "sm" | "3xl">
}

type ParsedConfig = {
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
		size: "sm" | "DEFAULT" | "lg",
	) => (typeof tailwindThemeTokens)["borderRadius"][number]
}

/**
 * Parses the config.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseConfig(config: Config): ParsedConfig {
	return {
		borderRadius: (size) => mapBorderRadius({ size, config }),
	}
}

/**
   * Maps the size based on the defined "base size".
   *
   * @example
   *    const baseSize = "lg"

   *    mapBorderRadius("sm")
   *    >> "md"
   *
   *    mapBorderRadius("DEFAULT")
   *    >> "lg"
   *
   *    mapBorderRadius("lg")
   *    >> "xl"
   */
function mapBorderRadius(args: {
	size: "sm" | "DEFAULT" | "lg"
	config: Config
}): (typeof tailwindThemeTokens)["borderRadius"][number] {
	// rounded-none entails no borders whatsoever
	// (disables the "sm", "DEFAULT", "lg" pattern)
	if (args.config.borderRadius === "none") {
		return "none"
	} else if (args.config.borderRadius === "full") {
		return "full"
	}
	const indexOfBase = tailwindThemeTokens["borderRadius"].findIndex(
		(value) => value === args.config.borderRadius,
	)
	switch (args.size) {
		case "sm":
			return tailwindThemeTokens["borderRadius"][indexOfBase - 1]!
		case "DEFAULT":
			return tailwindThemeTokens["borderRadius"][indexOfBase]!
		case "lg":
			return tailwindThemeTokens["borderRadius"][indexOfBase + 1]!
	}
}

/**
 * Tailwind theme tokens.
 *
 * Taken from https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 *
 * @example
 *    const x: typeof tailwindThemeTokens['borderRadius']
 *
 */
const tailwindThemeTokens = {
	/** Utilities for controlling the border radius of an element. */
	borderRadius: ["none", "sm", "DEFAULT", "md", "lg", "xl", "2xl", "3xl", "full"] as const,
} as const
