import plugin from "tailwindcss/plugin.js";
import colors from "tailwindcss/colors.js";
import type { Config } from "./types/config.cjs";
import { merge } from "lodash";
import { generateTokens } from "./generateTokens.cjs";

/**
 * Entrypoint for the colorsystem.
 */
export function withConfig(config: Partial<Config>) {
	// merge mutates default config
	merge(defaultConfig, config);
	const parsedConfig = generateTokens(defaultConfig);
	// @ts-ignore
	return plugin(() => undefined, {
		theme: {
			extend: {
				colors: parsedConfig.colors,
			},
		},
	});
}

// TODO - better default colors?
const defaultConfig: Config = {
	accentColors: {
		primary: colors.blue,
		secondary: colors.fuchsia,
		tertiary: colors.cyan,
	},
	neutralColors: {
		neutral: colors.stone,
		neutralVariant: colors.neutral,
	},
	semanticColors: {
		error: colors.red,
	},
	colorLevels: {
		base: 600,
		container: 200,
		onContainer: 900,
	},
};
