import type { Color } from "./color.cjs"

/**
 * The color systems config.
 */
export type Config = {
	accentColors: {
		/**
		 * Primary color.
		 *
		 * Is used to derive roles for key components across the UI,
		 * such as prominent buttons, active states,
		 * as well as the tint of elevated surfaces.
		 */
		primary: Color
		/**
		 * Secondary color.
		 *
		 * Is used for less prominent components in the UI,
		 * while expanding the opportunity for color expression.
		 */
		secondary?: Color
		/**
		 * Tertiary color.
		 *
		 * Is used to derive the roles of contrasting accents
		 * that can be used to balance primary and secondary
		 * colors or bring heightened attention to an element.
		 * The tertiary color role is left for teams to use at
		 * their discretion and is intended to support broader
		 * color expression in products.
		 */
		tertiary?: Color
		// TODO Re-add when custom color are supported (or never if design-system is only used internally)
		// [custom: string]: Color;
	}
	neutralColors: {
		/**
		 * Neutral color.
		 *
		 * Is used to derive the roles of surface and background,
		 * as well as high emphasis text and icons.
		 */
		neutral: Color
		/**
		 * Neutral variant color.
		 *
		 * Is used to derive medium emphasis text and icons,
		 * surface variants, and component outlines.
		 */
		neutralVariant: Color
		// TODO Re-add when custom color are supported (or never if design-system is only used internally)
		// [custom: string]: Color;
	}
	/**
	 * Semantic colors that your product needs like `error` or `success`.
	 *
	 * Custom colors pin specific hues that often are needed alongside expressive
	 * colors in UI as a way to communicate conventional meaning, such as errors.
	 */
	semanticColors: {
		[custom: string]: Color
	}
	/**
	 * The color levels of the color system.
	 *
	 * Base colors refer to accent and semantic colors
	 * like primary, secondary, error etc.
	 */
	colorLevels: {
		/**
		 * A base level higher than 600 would break the interaction state colors.
		 *
		 * The interaction state colors are generate in (generateTokens())[./generateTokens.cts].
		 */
		base: 100 | 200 | 300 | 400 | 500 | 600
		container: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
		onContainer: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
		onInvertedContainer: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
	}
}
