import { expect, test } from "vitest"
import { resolveEscapedCharacters } from "./resolveEscapedCharacters.js"

// TODO: Add support for \x sequences

const testCases: [string, string][] = [
	[
		"String with multiple \\t\\n\\r\\f escape sequences.",
		"String with multiple  escape sequences.",
	],
	["Escaped \\t\\n back-to-back.", "Escaped  back-to-back."],
	["String with escaped \\u0042 Unicode character.", "String with escaped B Unicode character."],
	["String without any escaped characters.", "String without any escaped characters."],
	["Escaped characters in the middle: abc\\n\\tdef.", "Escaped characters in the middle: abcdef."],
	["Double backslash: \\\\\\\\.", "Double backslash: ."],
	[
		"Escaped characters at the end: this is a test \\t\\n.",
		"Escaped characters at the end: this is a test .",
	],
	["Unicode sequence: \\u03A9 \\u03B1.", "Unicode sequence: Ω α."],
	// ["Escaped special sequences: \\x1F601 \\x1F4A9.", "Escaped special sequences:  ."],
	// ["Combination: \\t\\u0041\\n\\x1F4A9.", "Combination: A 💩."],
]

test("removeEscapedCharacter", () => {
	for (const [input, expected] of testCases) {
		expect(resolveEscapedCharacters(input)).toBe(expected)
	}
})
