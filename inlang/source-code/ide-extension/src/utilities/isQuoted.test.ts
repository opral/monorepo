import { expect, test } from "vitest"
import { isQuoted, stripQuotes } from "./isQuoted.js"

test("Regex matches quoted strings correctly", () => {
	const testCases = [
		{
			input: "'single quoted string'",
			expected: true, // Single quotes should match
		},
		{
			input: '"double quoted string"',
			expected: true, // Double quotes should match
		},
		{
			input: "`backtick quoted string`",
			expected: true, // Backticks should match
		},
		{
			input: "'single 'nested' quotes'",
			expected: true, // Nested single quotes should match
		},
		{
			input: '"double "nested" quotes"',
			expected: true, // Nested double quotes should match
		},
		{
			input: "'single `nested` backticks'",
			expected: true, // Nested backticks inside single quotes should match
		},
		{
			input: '"double `nested` backticks"',
			expected: true, // Nested backticks inside double quotes should match
		},
		{
			input: "`backtick 'nested' quotes`",
			expected: true, // Nested single quotes inside backticks should match
		},
		{
			input: '`backtick "nested" quotes`',
			expected: true, // Nested double quotes inside backticks should match
		},
		{
			input: "'single 'unbalanced nested quotes",
			expected: false, // Unbalanced nested single quotes should not match
		},
		{
			input: '"double "unbalanced nested quotes',
			expected: false, // Unbalanced nested double quotes should not match
		},
		{
			input: "`backtick `unbalanced nested backticks",
			expected: false, // Unbalanced nested backticks should not match
		},
		{
			input: "unquoted string",
			expected: false, // Non-quoted string should not match
		},
	]

	for (const testCase of testCases) {
		const { input, expected } = testCase
		const isMatch = isQuoted(input)

		expect(isMatch).toBe(expected)
	}
})

test("stripQuotes function correctly removes quotes", () => {
	const testCases = [
		{
			input: "'single quoted string'",
			expected: "single quoted string", // Single quotes should be removed
		},
		{
			input: '"double quoted string"',
			expected: "double quoted string", // Double quotes should be removed
		},
		{
			input: "`backtick quoted string`",
			expected: "backtick quoted string", // Backticks should be removed
		},
		{
			input: "'single 'nested' quotes'",
			expected: "single 'nested' quotes", // Nested single quotes should remain
		},
		{
			input: '"double "nested" quotes"',
			expected: 'double "nested" quotes', // Nested double quotes should remain
		},
		{
			input: "'single `nested` backticks'",
			expected: "single `nested` backticks", // Nested backticks should remain
		},
		{
			input: '"double `nested` backticks"',
			expected: "double `nested` backticks", // Nested backticks should remain
		},
		{
			input: "`backtick 'nested' quotes`",
			expected: "backtick 'nested' quotes", // Nested single quotes should remain
		},
		{
			input: '`backtick "nested" quotes`',
			expected: 'backtick "nested" quotes', // Nested double quotes should remain
		},
		{
			input: "unquoted string",
			expected: "unquoted string", // Non-quoted string should remain unchanged
		},
	]

	for (const testCase of testCases) {
		const { input, expected } = testCase
		const result = stripQuotes(input)

		expect(result).toBe(expected)
	}
})
