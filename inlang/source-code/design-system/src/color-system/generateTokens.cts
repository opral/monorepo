import type { Config } from "./types/config.cjs"
import type { ColorTokens } from "./types/colorTokens.cjs"
import { TinyColor } from "@ctrl/tinycolor"
import type { Color } from "./types/color.cjs"

// todos:
// - support for custom colors
// - non-hardcoded version
// - derive dark/light mode colors
export function generateTokens(config: Config): ColorTokens {
	const { accentColors, neutralColors, semanticColors } = config

	// ---- HELPER VARIABLES -----
	// Some tokens are always white.
	// See https://m3.material.io/styles/color/the-color-system/key-colors-tones
	const white = "#ffffff"

	// initlize the color system with neutral colors
	const tokens: Partial<ColorTokens> = {
		background: white,
		"on-background": neutralColors.neutral[900],
		// the surface color spec is derived from
		// https://m3.material.io/styles/color/the-color-system/color-roles#c0cdc1ba-7e67-4d6a-b294-218f659ff648
		// using neutral colors though to not be too colorful (while we don't have a designer on the team that
		// ensures that colors are matching the overall design)
		//new values subject to change
		"surface-50": neutralColors.neutral[50],
		"surface-100": neutralColors.neutral[100],
		"surface-200": neutralColors.neutral[200],
		"surface-300": neutralColors.neutral[300],
		"surface-400": neutralColors.neutral[400],
		"surface-500": neutralColors.neutral[500],
		"surface-600": neutralColors.neutral[600],
		"surface-700": neutralColors.neutral[700],
		"surface-800": neutralColors.neutral[800],
		"surface-900": neutralColors.neutral[900],
		//old values
		"surface-1": new TinyColor(neutralColors.neutral[900]).setAlpha(0.05).toHex8String(),
		"surface-2": new TinyColor(neutralColors.neutral[900]).setAlpha(0.08).toHex8String(),
		"surface-3": new TinyColor(neutralColors.neutral[900]).setAlpha(0.11).toHex8String(),
		"surface-4": new TinyColor(neutralColors.neutral[900]).setAlpha(0.12).toHex8String(),
		"surface-5": new TinyColor(neutralColors.neutral[900]).setAlpha(0.14).toHex8String(),
		"inverted-surface": neutralColors.neutral[800],
		"on-surface": neutralColors.neutral[900],
		"on-inverted-surface": neutralColors.neutral[100],
		"surface-variant": neutralColors.neutralVariant[200],
		"on-surface-variant": neutralColors.neutralVariant[600],
		outline: neutralColors.neutralVariant[300],
		"outline-variant": neutralColors.neutralVariant[500],
	}

	// add accent and semantic colors
	for (const [name, color] of Object.entries({
		...accentColors,
		...semanticColors,
	})) {
		tokens[name] = color[config.colorLevels.base]
		tokens[`on-${name}`] = white
		tokens[`${name}-container`] = color[config.colorLevels.container]
		tokens[`on-${name}-container`] = color[config.colorLevels.onContainer]
		tokens[`${name}-on-inverted-container`] = color[config.colorLevels.onInvertedContainer]
		// add interaction state colors
		// see https://m3.material.io/foundations/interaction-states
		if (config.colorLevels.base > 600) {
			throw `The base color level can not be higher than 600. 
			Otherwise, the derived interaction state colors break.`
		}
		// the tokens are adapted to the web:
		// 1. no drag token.
		// 2. press token = the active token
		tokens[`hover-${name}`] =
			// shoelace lightens the color on hover. TODO: change
			// shoelace style eventually.
			color[(config.colorLevels.base - 100) as keyof Color]
		tokens[`focus-${name}`] = color[(config.colorLevels.base + 200) as keyof Color]
		tokens[`active-${name}`] = color[(config.colorLevels.base + 300) as keyof Color]
		// no drag token because css has no drag selector. the press and drag token
		// are identical.
	}

	// "single" interaction states.
	// see https://m3.material.io/foundations/interaction-states
	//
	// disabled states always use the on-surface color but with
	// different opacity values
	tokens[`disabled-content`] = new TinyColor(tokens["on-surface"]).setAlpha(38).toHex8String()
	tokens[`disabled-container`] = new TinyColor(tokens["on-surface"]).setAlpha(12).toHex8String()

	return tokens as ColorTokens
}
