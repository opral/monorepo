import type MagicString from "magic-string"

type OverrideValue = {
	start: number
	end: number
	value: string
}

/**
 * Overrides the given character ranges with the given values.
 * @param overridevaluess
 */
export function overrideRanges(string: MagicString, overridevalues: OverrideValue[]): MagicString {
	for (const overridevalue of overridevalues) {
		string.overwrite(overridevalue.start, overridevalue.end, overridevalue.value)
	}
	return string
}
