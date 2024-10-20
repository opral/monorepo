import { expect, it } from "vitest";
import { detectJsonFormatting } from "./detectJsonFormatting.js";

it("should detect spacing", () => {
	// test all possible spacings
	for (const value of [1, 2, 3, 4, 6, 8, "\t"]) {
		const spacing = value === "\t" ? "\t" : " ".repeat(value as number);
		const objectWithSpacing = `{\n${spacing}"test": "test"\n}`;

		const serialize = detectJsonFormatting(objectWithSpacing);
		expect(serialize(JSON.parse(objectWithSpacing))).toBe(objectWithSpacing);
	}
});

it("should detect spacing if the json is an array", () => {
	// testing with one element only because dynamic generation of
	// arrays with different spacings is too complex
	const objectWithSpacing = `[\n\t"test",\n\t"test"\n]`;

	const serialize = detectJsonFormatting(objectWithSpacing);
	expect(serialize(JSON.parse(objectWithSpacing))).toBe(objectWithSpacing);
});

it("should detect new lines correctly", () => {
	const withNewLine = `{"test":"test"}\n`;
	const withoutNewLine = `{"test":"test"}`;
	const withNewLineAndSpacing = `{\n\t"test": "test"\n}`;

	const serialize1 = detectJsonFormatting(withNewLine);
	const serialize2 = detectJsonFormatting(withoutNewLine);
	const serialize3 = detectJsonFormatting(withNewLineAndSpacing);

	expect(serialize1(JSON.parse(withNewLine))).toBe(withNewLine);
	expect(serialize2(JSON.parse(withoutNewLine))).toBe(withoutNewLine);
	expect(serialize3(JSON.parse(withNewLineAndSpacing))).toBe(
		withNewLineAndSpacing
	);
});
