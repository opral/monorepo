import type { Config } from "../types/config.cjs";
import type { ParsedConfig } from "../types/parsedConfig.cjs";
import { tailwindThemeTokens } from "./tailwindThemeTokens.cjs";

/**
 * Parses the config.
 */
export function parseConfig(config: Config): ParsedConfig {
	return {
		borderRadius: (size) => mapBorderRadius({ size, config }),
	};
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
	size: "sm" | "DEFAULT" | "lg";
	config: Config;
}): typeof tailwindThemeTokens["borderRadius"][number] {
	// rounded-none entails no borders whatsoever
	// (disables the "sm", "DEFAULT", "lg" pattern)
	if (args.config.borderRadius === "none") {
		return "none";
	} else if (args.config.borderRadius === "full") {
		return "full";
	}
	const indexOfBase = tailwindThemeTokens["borderRadius"].findIndex(
		(value) => value === args.config.borderRadius
	);
	switch (args.size) {
		case "sm":
			return tailwindThemeTokens["borderRadius"][indexOfBase - 1];
		case "DEFAULT":
			return tailwindThemeTokens["borderRadius"][indexOfBase];
		case "lg":
			return tailwindThemeTokens["borderRadius"][indexOfBase + 1];
	}
}
