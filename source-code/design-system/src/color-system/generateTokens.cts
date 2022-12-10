import type { Config } from "./types/config.cjs";
import type { ColorTokens } from "./types/colorTokens.cjs";
import { TinyColor } from "@ctrl/tinycolor";
import type { Color } from "./types/color.cjs";

// todos:
// - support surface levels (100,200,300,400,500)
//   see https://m3.material.io/styles/color/the-color-system/color-roles
// - support for custom colors
// - non-hardcoded version
// - derive dark/light mode colors
export function generateTokens(config: Config): ColorTokens {
	const { accentColors, neutralColors, semanticColors } = config;

	// ---- HELPER VARIABLES -----
	// Some tokens are always white.
	// See https://m3.material.io/styles/color/the-color-system/key-colors-tones
	const white = "#ffffff";

	// initlize the color system with neutral colors
	const tokens: Partial<ColorTokens> = {
		background: white,
		"on-background": neutralColors.neutral[900],
		"surface-100": new TinyColor(neutralColors.neutral[900])
			.lighten(88)
			.toHex8String(),
		"surface-200": new TinyColor(neutralColors.neutral[900])
			.lighten(85)
			.toHex8String(),
		"surface-300": new TinyColor(neutralColors.neutral[900])
			.lighten(82)
			.toHex8String(),
		"surface-400": new TinyColor(neutralColors.neutral[900])
			.lighten(80)
			.toHex8String(),
		"surface-500": new TinyColor(neutralColors.neutral[900])
			.lighten(78)
			.toHex8String(),
		"on-surface": neutralColors.neutral[900],
		"surface-variant": neutralColors.neutralVariant[100],
		"on-surface-variant": neutralColors.neutralVariant[600],
		outline: neutralColors.neutralVariant[300],
		"outline-variant": neutralColors.neutralVariant[500],
	};

	// add accent and semantic colors
	for (const [name, color] of Object.entries({
		...accentColors,
		...semanticColors,
	})) {
		tokens[name] = color[config.colorLevels.base];
		tokens[`on-${name}`] = white;
		tokens[`${name}-container`] = color[config.colorLevels.container];
		tokens[`on-${name}-container`] = color[config.colorLevels.onContainer];
		// add interaction state colors
		// see https://m3.material.io/foundations/interaction-states
		if (config.colorLevels.base > 600) {
			throw `The base color level can not be higher than 600. 
			Otherwise, the derived interaction state colors break.`;
		}
		// the tokens are adapted to the web:
		// 1. no drag token.
		// 2. press token = the active token
		tokens[`hover-${name}`] =
			// shoelace lightens the color on hover. TODO: change
			// shoelace style eventually.
			color[(config.colorLevels.base - 100) as keyof Color];
		tokens[`focus-${name}`] =
			color[(config.colorLevels.base + 200) as keyof Color];
		tokens[`active-${name}`] =
			color[(config.colorLevels.base + 300) as keyof Color];
		// no drag token because css has no drag selector. the press and drag token
		// are identical.
	}

	// "single" interaction states.
	// see https://m3.material.io/foundations/interaction-states
	//
	// disabled states always use the on-surface color but with
	// different opacity values
	// colors[`disabled-content`] = new TinyColor(colors["on-surface-100-container"])
	//   .setAlpha(38)
	//   .toHex8String();
	tokens[`disabled-content`] = new TinyColor(tokens["on-surface"])
		.lighten(60)
		.toHex8String();
	tokens[`disabled-container`] = new TinyColor(tokens["on-surface"])
		.lighten(75)
		.toHex8String();

	return tokens as ColorTokens;
}
