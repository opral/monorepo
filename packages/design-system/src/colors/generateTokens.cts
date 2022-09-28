import type { Config } from "./types/config.cjs";
import type { Tokens } from "./types/tokens.cjs";
import { TinyColor } from "@ctrl/tinycolor";
import type { Color } from "./types/color.cjs";

// todos:
// - support surface levels (100,200,300,400,500)
//   see https://m3.material.io/styles/color/the-color-system/color-roles
// - support for custom colors
// - non-hardcoded version
// - derive dark/light mode colors
export function generateTokens(config: Config): Tokens {
	const { accentColors, neutralColors, semanticColors } = config;

	// ---- HELPER VARIABLES -----
	// Some tokens are always white.
	// See https://m3.material.io/styles/color/the-color-system/key-colors-tones
	const white = "#ffffff";

	// initlize the color system with neutral colors
	const tokens: Partial<Tokens> = {
		background: white,
		"on-background": neutralColors.neutral[900],
		"surface-100": new TinyColor(accentColors.primary[900])
			.setAlpha(0.05)
			.toHex8String(),
		"surface-200": new TinyColor(accentColors.primary[900])
			.setAlpha(0.08)
			.toHex8String(),
		"surface-300": new TinyColor(accentColors.primary[900])
			.setAlpha(0.11)
			.toHex8String(),
		"surface-400": new TinyColor(accentColors.primary[900])
			.setAlpha(0.12)
			.toHex8String(),
		"surface-500": new TinyColor(accentColors.primary[900])
			.setAlpha(0.14)
			.toHex8String(),
		"on-surface": neutralColors.neutral[900],
		"surface-variant": neutralColors.neutralVariant[100],
		"on-surface-variant": neutralColors.neutralVariant[600],
		outline: neutralColors.neutralVariant[400],
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
		tokens[`hover-${name}`] =
			color[(config.colorLevels.base + 100) as keyof Color];
		tokens[`focus-${name}`] =
			color[(config.colorLevels.base + 200) as keyof Color];
		tokens[`press-${name}`] =
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
		.setAlpha(0.38)
		.toHex8String();
	tokens[`disabled-container`] = new TinyColor(tokens["on-surface"])
		.setAlpha(0.12)
		.toHex8String();

	return tokens as Tokens;
}
