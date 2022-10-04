import plugin from "tailwindcss/plugin";
import { generateTokens } from "./generateTokens.cjs";
import type { Config } from "./types/config.cjs";
import colors from "tailwindcss/colors.js";
import { merge } from "lodash";

/**
 * Entrypoint for the colorsystem.
 *
 * The colorsystem has default values. Defining every property
 * in the config is not required.
 */
export function configure(config: Partial<Config>) {
	// merge mutates default config
	// this line allows the user to specify a partial config
	// and only change the primary color for example.
	merge(USED_COLOR_SYSTEM_CONFIG, config);
	const tokens = generateTokens(USED_COLOR_SYSTEM_CONFIG);
	// @ts-ignore
	return plugin(() => undefined, {
		theme: {
			extend: {
				colors: tokens,
			},
		},
	});
}

/**
 * The config that has been used by the plugin to generate the tokens.
 *
 * This variable defines defaults and is used by other elements of the design
 * system to generate accompanying classes.
 */
// TODO - better default values
export let USED_COLOR_SYSTEM_CONFIG: Config = {
	accentColors: {
		primary: colors.blue,
		secondary: colors.gray,
		tertiary: colors.teal,
	},
	neutralColors: {
		neutral: colors.neutral,
		neutralVariant: colors.stone,
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
