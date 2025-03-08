import { test, expect } from "vitest";
import { compileMessage } from "./compile-message.js";
import type { Declaration, Message, Variant } from "@inlang/sdk";
import { createRegistry } from "./registry.js";

test("compiles a message with a single variant", async () => {
	const declarations: Declaration[] = [];
	const message: Message = {
		locale: "en",
		bundleId: "some_message",
		id: "message-id",
		selectors: [],
	};
	const variants: Variant[] = [
		{
			id: "1",
			messageId: "message-id",
			matches: [],
			pattern: [{ type: "text", value: "Hello" }],
		},
	];

	const compiled = compileMessage(declarations, message, variants);

	const { some_message } = await import(
		"data:text/javascript;base64," +
			btoa("export const some_message =" + compiled.code)
	);

	expect(some_message()).toBe("Hello");
});

test("compiles a message with variants", async () => {
	const declarations: Declaration[] = [
		{ type: "input-variable", name: "fistInput" },
		{ type: "input-variable", name: "secondInput" },
	];

	const message: Message = {
		locale: "en",
		id: "some_message",
		bundleId: "some_message",
		selectors: [
			{ type: "variable-reference", name: "fistInput" },
			{ type: "variable-reference", name: "secondInput" },
		],
	};

	const variants: Variant[] = [
		{
			id: "1",
			messageId: "some_message",
			matches: [
				{ type: "literal-match", key: "fistInput", value: "1" },
				{ type: "literal-match", key: "secondInput", value: "2" },
			],
			pattern: [
				{ type: "text", value: "The inputs are " },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "fistInput" },
				},
				{ type: "text", value: " and " },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "secondInput" },
				},
			],
		},
		{
			id: "2",
			messageId: "some_message",
			matches: [
				{ type: "catchall-match", key: "fistInput" },
				{ type: "catchall-match", key: "secondInput" },
			],
			pattern: [{ type: "text", value: "Catch all" }],
		},
	];

	const compiled = compileMessage(declarations, message, variants);

	const { some_message } = await import(
		"data:text/javascript;base64," +
			btoa("export const some_message =" + compiled.code)
	);

	expect(some_message({ fistInput: 1, secondInput: 2 })).toBe(
		"The inputs are 1 and 2"
	);
	expect(some_message({ fistInput: 3, secondInput: 4 })).toBe("Catch all");
	expect(some_message({ fistInput: 1, secondInput: 5 })).toBe("Catch all");
});

test("compiles multi-variant message with a fallback in case the variants are not matched", async () => {
	const declarations: Declaration[] = [
		{ type: "input-variable", name: "fistInput" },
		{ type: "input-variable", name: "secondInput" },
	];

	const message: Message = {
		locale: "en",
		id: "some_message",
		bundleId: "some_message",
		selectors: [
			{ type: "variable-reference", name: "fistInput" },
			{ type: "variable-reference", name: "secondInput" },
		],
	};

	const variants: Variant[] = [
		{
			id: "1",
			messageId: "some_message",
			matches: [
				{ type: "literal-match", key: "fistInput", value: "1" },
				{ type: "literal-match", key: "secondInput", value: "2" },
			],
			pattern: [
				{ type: "text", value: "The inputs are " },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "fistInput" },
				},
				{ type: "text", value: " and " },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "secondInput" },
				},
			],
		},
		{
			id: "2",
			messageId: "some_message",
			matches: [
				{ type: "catchall-match", key: "fistInput" },
				{ type: "literal-match", key: "secondInput", value: "2" },
			],
			pattern: [{ type: "text", value: "Catch all" }],
		},
	];

	const compiled = compileMessage(declarations, message, variants);

	const { some_message } = await import(
		"data:text/javascript;base64," +
			btoa("export const some_message = " + compiled.code)
	);

	expect(some_message({ secondInput: 2 })).toBe("Catch all");
	expect(some_message({})).toBe("some_message");
});

test("only emits input arguments when inputs exist", async () => {
	const declarations: Declaration[] = [];
	const message: Message = {
		locale: "en",
		bundleId: "some_message",
		id: "message-id",
		selectors: [],
	};
	const variants: Variant[] = [
		{
			id: "1",
			messageId: "message-id",
			matches: [],
			pattern: [{ type: "text", value: "Hello" }],
		},
	];

	const compiled = compileMessage(declarations, message, variants);

	expect(compiled.code).toBe(
		"/** @type {(inputs: {}) => string} */ () => {\n\treturn `Hello`\n};"
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/379
test("compiles messages that use plural()", async () => {
	const declarations: Declaration[] = [
		{ type: "input-variable", name: "count" },
		{
			type: "local-variable",
			name: "countPlural",
			value: {
				arg: { type: "variable-reference", name: "count" },
				annotation: {
					type: "function-reference",
					name: "plural",
					options: [],
				},
				type: "expression",
			},
		},
	];
	const message: Message = {
		locale: "en",
		bundleId: "plural_test",
		id: "message_id",
		selectors: [{ type: "variable-reference", name: "countPlural" }],
	};
	const variants: Variant[] = [
		{
			id: "1",
			messageId: "message_id",
			matches: [{ type: "literal-match", value: "one", key: "countPlural" }],
			pattern: [{ type: "text", value: "There is one cat." }],
		},
		{
			id: "2",
			messageId: "message_id",
			matches: [
				{
					type: "literal-match",
					value: "other",
					key: "countPlural",
				},
			],
			pattern: [{ type: "text", value: "There are many cats." }],
		},
	];

	const compiled = compileMessage(declarations, message, variants);

	const { plural_test } = await import(
		"data:text/javascript;base64," +
			// bundling the registry inline to avoid managing module imports here
			btoa(createRegistry()) +
			btoa(
				"export const plural_test = " + compiled.code.replace("registry.", "")
			)
	);

	expect(plural_test({ count: 1 })).toBe("There is one cat.");
	expect(plural_test({ count: 2 })).toBe("There are many cats.");
	// INTL.plural will match "other" for undefined
	expect(plural_test({ count: undefined })).toBe("There are many cats.");
});

test("compiles messages that use datetime()", async () => {
	const createMessage = async (locale: string) => {
		const declarations: Declaration[] = [
			{ type: "input-variable", name: "count" },
			{
				type: "local-variable",
				name: "formattedDate",
				value: {
					arg: { type: "variable-reference", name: "date" },
					annotation: {
						type: "function-reference",
						name: "datetime",
						options: [],
					},
					type: "expression",
				},
			},
		];

		const message: Message = {
			locale,
			bundleId: "datetime_test",
			id: "message_id",
			selectors: [],
		};

		const variants: Variant[] = [
			{
				id: "1",
				messageId: "message_id",
				matches: [],
				pattern: [
					{ type: "text", value: "Today is " },
					{
						type: "expression",
						arg: { type: "variable-reference", name: "formattedDate" },
					},
					{ type: "text", value: "." },
				],
			},
		];

		const compiled = compileMessage(declarations, message, variants);

		const { datetime_test } = await import(
			"data:text/javascript;base64," +
				// bundling the registry inline to avoid managing module imports here
				btoa(createRegistry()) +
				btoa(
					"export const datetime_test =" +
						compiled.code.replace("registry.", "")
				)
		);
		return datetime_test;
	};

	const enMessage = await createMessage("en");
	const deMessage = await createMessage("de");

	expect(enMessage({ date: "2022-04-01" })).toMatch(
		/Today is \d{1,2}\/\d{1,2}\/2022\./
	);

	expect(deMessage({ date: "2022-04-01" })).toMatch(
		/Today is \d{1,2}\.\d{1,2}\.2022\./
	);
});

test("compiles messages that use datetime a function with options", async () => {
	const createMessage = async (locale: string) => {
		const declarations: Declaration[] = [
			{ type: "input-variable", name: "count" },
			{
				type: "local-variable",
				name: "formattedDate",
				value: {
					arg: { type: "variable-reference", name: "date" },
					annotation: {
						type: "function-reference",
						name: "datetime",
						options: [
							{ name: "month", value: { type: "literal", value: "long" } },
							{ name: "day", value: { type: "literal", value: "numeric" } },
						],
					},
					type: "expression",
				},
			},
		];

		const message: Message = {
			locale,
			bundleId: "datetime_test",
			id: "message_id",
			selectors: [],
		};

		const variants: Variant[] = [
			{
				id: "1",
				messageId: "message_id",
				matches: [],
				pattern: [
					{ type: "text", value: "Today is " },
					{
						type: "expression",
						arg: { type: "variable-reference", name: "formattedDate" },
					},
					{ type: "text", value: "." },
				],
			},
		];

		const compiled = compileMessage(declarations, message, variants);

		const { datetime_test } = await import(
			"data:text/javascript;base64," +
				// bundling the registry inline to avoid managing module imports here
				btoa(createRegistry()) +
				btoa(
					"export const datetime_test = " +
						compiled.code.replace("registry.", "")
				)
		);
		return datetime_test;
	};

	const enMessage = await createMessage("en");
	const deMessage = await createMessage("de");

	// needs regex to avoid timezone's effecting the unit test
	expect(enMessage({ date: "2022-03-31" })).toMatch(/Today is March \d{1,2}\./);
	expect(deMessage({ date: "2022-03-31" })).toMatch(
		/Today is \d{1,2}\. März\./
	);
});
