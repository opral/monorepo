import type { Config } from "./types/config.cjs";
import type { Tokens } from "./types/tokens.cjs";
import { TinyColor } from "@ctrl/tinycolor";

// todos:
// - support surface levels (100,200,300,400,500)
//   see https://m3.material.io/styles/color/the-color-system/color-roles
// - support for custom colors
// - non-hardcoded version
// - derive dark/light mode colors
export function generateTokens(config: Config): { colors: Tokens } {
	const { accentColors, neutralColors, semanticColors } = config;

	// ---- HELPER VARIABLES -----
	// Some tokens are always white.
	// See https://m3.material.io/styles/color/the-color-system/key-colors-tones
	const white = "#ffffff";
	// regular colors refer to accent and semantic colors.
	// like primary, secondary, error etc.
	const regular = 700;
	const container = 200;
	const onContainer = 900;

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
	}

	// add interaction state colors
	// see https://m3.material.io/foundations/interaction-states
	for (const [name, hex] of Object.entries(tokens)) {
		tokens[`hover-${name}`] = new TinyColor(hex).darken(8).toHex8String();
		tokens[`focus-${name}`] = new TinyColor(hex).darken(12).toHex8String();
		tokens[`press-${name}`] = new TinyColor(hex).darken(12).toHex8String();
		tokens[`drag-${name}`] = new TinyColor(hex).darken(16).toHex8String();
		// no selected or activated colors because:
		//
		//   "Unlike hover, focus, pressed, and dragged states
		//    that use state layers, components using the activated
		//    or selected states change the container and content
		//    color directly".
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

	return {
		colors: tokens as Tokens,
	};
}
