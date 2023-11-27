import { expect, test } from "vitest"
import { isQuoted, stripQuotes } from "./isQuoted.js"

const testCases = [
	{
		input: "'single quoted string'",
		output: "single quoted string",
		isQuoted: true,
	},
	{
		input: '"double quoted string"',
		output: "double quoted string",
		isQuoted: true,
	},
	{
		input: "`backtick quoted string`",
		output: "backtick quoted string",
		isQuoted: true,
	},
	{
		input: "'single 'nested' quotes'",
		output: "single 'nested' quotes",
		isQuoted: true,
	},
	{
		input: '"double "nested" quotes"',
		output: 'double "nested" quotes',
		isQuoted: true,
	},
	{
		input: "'single `nested` backticks'",
		output: "single `nested` backticks",
		isQuoted: true,
	},
	{
		input: '"double `nested` backticks"',
		output: "double `nested` backticks",
		isQuoted: true,
	},
	{
		input: "`backtick 'nested' quotes`",
		output: "backtick 'nested' quotes",
		isQuoted: true,
	},
	{
		input: '`backtick "nested" quotes`',
		output: 'backtick "nested" quotes',
		isQuoted: true,
	},
	{
		input: "'single 'unbalanced nested quotes",
		output: "'single 'unbalanced nested quotes",
		isQuoted: false,
	},
	{
		input: '"double "unbalanced nested quotes',
		output: '"double "unbalanced nested quotes',
		isQuoted: false,
	},
	{
		input: "`backtick `unbalanced nested backticks",
		output: "`backtick `unbalanced nested backticks",
		isQuoted: false,
	},
	{
		input: "unquoted string",
		output: "unquoted string",
		isQuoted: false,
	},
]

for (const testCase of testCases) {
	const { input, output, isQuoted: expected } = testCase
	const isMatch = isQuoted(input)
	const result = stripQuotes(input)

	test(`Detect & strip quote ${input}`, () => {
		expect(isMatch).toBe(expected)
		expect(result).toBe(output)
	})
}
