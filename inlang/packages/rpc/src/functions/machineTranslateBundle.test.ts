import { expect, test } from "vitest";
import { machineTranslateBundle } from "./machineTranslateBundle.js";
import type { BundleNested, Text } from "@inlang/sdk";

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"it should machine translate to all provided target locales and variants",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de", "fr", "en"],
			bundle: {
				id: "mock-bundle-id",
				declarations: [],
				messages: [
					{
						id: "mock-message-id",
						bundleId: "mock-bundle-id",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "mock-variant-id-name-john",
								messageId: "mock-message-id",
								matches: [
									{
										type: "literal-match",
										key: "name",
										value: "John",
									},
								],
								pattern: [{ type: "text", value: "Hello world, John" }],
							},
							{
								id: "mock-variant-id-*",
								messageId: "mock-message-id",
								matches: [
									{
										type: "catchall-match",
										key: "name",
									},
								],
								pattern: [{ type: "text", value: "Hello world" }],
							},
						],
					},
				],
			} as BundleNested,
		});

		const bundle = result.data;
		const messages = result.data?.messages;
		const variants = messages?.flatMap((m) => m.variants);

		expect(bundle).toBeDefined();
		expect(messages).toHaveLength(3);
		expect(variants).toHaveLength(6);

		const messageIds = messages?.map((m) => m.id);
		const variantIds = variants?.map((v) => v.id);

		// unique ids
		expect(messageIds?.length).toEqual(new Set(messageIds).size);
		expect(variantIds?.length).toEqual(new Set(variantIds).size);

		// every variant id should be in the message ids
		expect(
			variants?.every((variant) => messageIds?.includes(variant.messageId))
		).toBe(true);

		// every message should have the same bundle id
		expect(messages?.every((message) => message.bundleId === bundle?.id)).toBe(
			true
		);

		expect(messages).toStrictEqual(
			expect.arrayContaining([
				// the base message should be unmodified
				expect.objectContaining({
					id: "mock-message-id",
					locale: "en",
				}),
				// a german message should exist after translation
				expect.objectContaining({
					locale: "de",
				}),
				// a french message should exist after translation
				expect.objectContaining({
					locale: "fr",
				}),
			])
		);

		expect(variants).toStrictEqual(
			expect.arrayContaining([
				// the english variant should be identical
				expect.objectContaining({
					id: "mock-variant-id-name-john",
					messageId: "mock-message-id",
					matches: [
						{
							type: "literal-match",
							key: "name",
							value: "John",
						},
					],
					pattern: [{ type: "text", value: "Hello world, John" }],
				}),
				expect.objectContaining({
					id: "mock-variant-id-*",
					messageId: "mock-message-id",
					matches: [
						{
							type: "catchall-match",
							key: "name",
						},
					],
					pattern: [{ type: "text", value: "Hello world" }],
				}),
				// a german variant should exist
				expect.objectContaining({
					matches: [
						{
							type: "literal-match",
							key: "name",
							value: "John",
						},
					],
					pattern: [{ type: "text", value: "Hallo Welt, John" }],
				}),
				expect.objectContaining({
					matches: [
						{
							type: "catchall-match",
							key: "name",
						},
					],
					pattern: [{ type: "text", value: "Hallo Welt" }],
				}),
				// a french variant should exist
				expect.objectContaining({
					matches: [
						{
							type: "literal-match",
							key: "name",
							value: "John",
						},
					],
					pattern: [{ type: "text", value: "Bonjour tout le monde, John" }],
				}),
				expect.objectContaining({
					matches: [
						{
							type: "catchall-match",
							key: "name",
						},
					],
					pattern: [{ type: "text", value: "Bonjour le monde" }],
				}),
			])
		);
	}
);

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"should escape expressions in patterns",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mock-bundle-id",
				declarations: [],
				messages: [
					{
						id: "mock-message-id",
						bundleId: "mock-bundle-id",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "mock-variant-id",
								messageId: "mock-message-id",
								matches: [],
								pattern: [
									{ type: "text", value: "There are " },
									{
										type: "expression",
										arg: { type: "variable", name: "num" },
									},
									{ type: "text", value: " cars on the street." },
								],
							},
						],
					},
				],
			} as BundleNested,
		});

		const messages = result.data?.messages;
		const variants = messages?.flatMap((m) => m.variants);

		expect(messages).toStrictEqual(
			expect.arrayContaining([
				// the base message should be unmodified
				expect.objectContaining({
					id: "mock-message-id",
					locale: "en",
				}),
				// a german message should exist after translation
				expect.objectContaining({
					locale: "de",
				}),
			])
		);

		expect(variants).toStrictEqual(
			expect.arrayContaining([
				// the english variant should be identical
				expect.objectContaining({
					pattern: [
						{ type: "text", value: "There are " },
						{ type: "expression", arg: { type: "variable", name: "num" } },
						{ type: "text", value: " cars on the street." },
					],
				}),
				// a german variant should exist
				expect.objectContaining({
					pattern: [
						{ type: "text", value: "Es sind " },
						{ type: "expression", arg: { type: "variable", name: "num" } },
						{ type: "text", value: " Autos auf der Straße." },
					],
				}),
			])
		);
	}
);

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"should not re-translate existing variants identified by their matches array",
	async () => {
		// Create a spy to track fetch calls
		const originalFetch = global.fetch;
		let fetchCalls = 0;

		// Mock fetch to count calls
		global.fetch = async (url, options) => {
			fetchCalls++;
			return originalFetch(url, options);
		};

		try {
			// Create a bundle with an English source message with two variants
			// and a German message with matching variants but different content
			const result = await machineTranslateBundle({
				sourceLocale: "en",
				targetLocales: ["de", "fr"],
				bundle: {
					id: "mock-bundle-id",
					declarations: [],
					messages: [
						// English source message with two variants
						{
							id: "en-message-id",
							bundleId: "mock-bundle-id",
							locale: "en",
							selectors: [],
							variants: [
								// Default variant (empty matches)
								{
									id: "en-variant-1",
									messageId: "en-message-id",
									matches: [],
									pattern: [{ type: "text", value: "Default text" }],
								},
								// Variant with count=1
								{
									id: "en-variant-2",
									messageId: "en-message-id",
									matches: [
										{
											type: "literal-match",
											key: "count",
											value: "1",
										},
									],
									pattern: [{ type: "text", value: "One item" }],
								},
								// Variant with count=2
								{
									id: "en-variant-3",
									messageId: "en-message-id",
									matches: [
										{
											type: "literal-match",
											key: "count",
											value: "2",
										},
									],
									pattern: [{ type: "text", value: "Two items" }],
								},
							],
						},
						// German message with two matching variants but different content
						{
							id: "de-message-id",
							bundleId: "mock-bundle-id",
							locale: "de",
							selectors: [],
							variants: [
								// Default variant (empty matches)
								{
									id: "de-variant-1",
									messageId: "de-message-id",
									matches: [],
									pattern: [
										{
											type: "text",
											value: "Standardtext (sollte nicht übersetzt werden)",
										},
									],
								},
								// Variant with count=1
								{
									id: "de-variant-2",
									messageId: "de-message-id",
									matches: [
										{
											type: "literal-match",
											key: "count",
											value: "1",
										},
									],
									pattern: [
										{
											type: "text",
											value: "Ein Element (sollte nicht übersetzt werden)",
										},
									],
								},
							],
						},
					],
				} as BundleNested,
			});

			// Verify the result
			expect(result.error).toBeUndefined();
			const messages = result.data?.messages;

			// We should have 3 messages (en, de, fr)
			expect(messages).toHaveLength(3);

			// Find the German message
			const germanMessage = messages?.find((m) => m.locale === "de");
			expect(germanMessage).toBeDefined();
			expect(germanMessage?.id).toBe("de-message-id");

			// Find the German variants
			const germanVariants = germanMessage?.variants || [];

			// Should have 3 variants now (2 existing + 1 new for count=2)
			expect(germanVariants).toHaveLength(3);

			// Verify the default variant (empty matches) was preserved
			const defaultVariant = germanVariants.find(
				(v) => v.matches?.length === 0
			);
			expect(defaultVariant).toBeDefined();
			expect(defaultVariant?.pattern).toStrictEqual([
				{ type: "text", value: "Standardtext (sollte nicht übersetzt werden)" },
			]);

			// Verify the count=1 variant was preserved
			const countOneVariant = germanVariants.find((v) => {
				if (!v.matches || v.matches.length !== 1) return false;
				const match = v.matches[0];
				if (!match) return false;
				return (
					match.type === "literal-match" &&
					match.key === "count" &&
					"value" in match &&
					match.value === "1"
				);
			});
			expect(countOneVariant).toBeDefined();
			expect(countOneVariant?.pattern).toStrictEqual([
				{ type: "text", value: "Ein Element (sollte nicht übersetzt werden)" },
			]);

			// Verify a new variant was added for count=2
			const countTwoVariant = germanVariants.find((v) => {
				if (!v.matches || v.matches.length !== 1) return false;
				const match = v.matches[0];
				if (!match) return false;
				return (
					match.type === "literal-match" &&
					match.key === "count" &&
					"value" in match &&
					match.value === "2"
				);
			});
			expect(countTwoVariant).toBeDefined();
			expect(countTwoVariant?.pattern?.[0]?.type).toBe("text");

			// Find the French message
			const frenchMessage = messages?.find((m) => m.locale === "fr");
			expect(frenchMessage).toBeDefined();

			// French should have 3 variants (all translated)
			expect(frenchMessage?.variants.length).toBe(3);

			// Verify fetch was called 4 times:
			// - 1 for the new German variant (count=2)
			// - 3 for all French variants
			expect(fetchCalls).toBe(4);
		} finally {
			// Restore the original fetch
			global.fetch = originalFetch;
		}
	}
);

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"should keep line breaks in multiline translations",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mockBundle",
				declarations: [],
				messages: [
					{
						id: "mockMessage",
						bundleId: "mockBundle",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "internal-dummy-id",
								messageId: "dummy-id",
								matches: [],
								pattern: [
									{
										type: "text",
										value: "This is a\nmultiline\ntranslation.",
									},
								],
							},
						],
					},
				],
			},
		});
		const messages = result.data?.messages;
		const variants = messages?.flatMap((m) => m.variants);

		expect(variants).toStrictEqual(
			expect.arrayContaining([
				// the english variant should be identical
				expect.objectContaining({
					pattern: [
						{ type: "text", value: "This is a\nmultiline\ntranslation." },
					],
				}),
				// a german variant should exist
				expect.objectContaining({
					pattern: [
						{ type: "text", value: "Dies ist ein\nmehrzeilig\nÜbersetzung." },
					],
				}),
			])
		);
	}
);

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"should translate empty patterns and patterns with empty text",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mock-bundle-id",
				declarations: [],
				messages: [
					// English source message
					{
						id: "en-message-id",
						bundleId: "mock-bundle-id",
						locale: "en",
						selectors: [],
						variants: [
							// Regular variant with content (default)
							{
								id: "en-variant-1",
								messageId: "en-message-id",
								matches: [],
								pattern: [{ type: "text", value: "Original text" }],
							},
							// Variant with count=1 match
							{
								id: "en-variant-2",
								messageId: "en-message-id",
								matches: [
									{
										type: "literal-match",
										key: "count",
										value: "1",
									},
								],
								pattern: [{ type: "text", value: "One item" }],
							},
						],
					},
					// German message with empty variants
					{
						id: "de-message-id",
						bundleId: "mock-bundle-id",
						locale: "de",
						selectors: [],
						variants: [
							// Empty pattern array
							{
								id: "de-variant-empty-array",
								messageId: "de-message-id",
								matches: [],
								pattern: [], // Empty pattern array
							},
							// Pattern with empty text
							{
								id: "de-variant-empty-text",
								messageId: "de-message-id",
								matches: [
									{
										type: "literal-match",
										key: "count",
										value: "1",
									},
								],
								pattern: [{ type: "text", value: "" }], // Pattern with empty text
							},
						],
					},
				],
			} as BundleNested,
		});

		// Verify the result
		expect(result.error).toBeUndefined();
		const messages = result.data?.messages;

		// Find the German message
		const germanMessage = messages?.find((m) => m.locale === "de");
		expect(germanMessage).toBeDefined();

		// Find the German variants
		const germanVariants = germanMessage?.variants || [];

		// The empty pattern array should have been translated
		const emptyArrayVariant = germanVariants.find(
			(v) => v.id === "de-variant-empty-array"
		);
		expect(emptyArrayVariant).toBeDefined();

		// The empty text variant should have been translated
		const emptyTextVariant = germanVariants.find(
			(v) => v.id === "de-variant-empty-text"
		);
		expect(emptyTextVariant).toBeDefined();

		// Test that the existing variants were updated, not replaced
		expect(emptyArrayVariant?.id).toBe("de-variant-empty-array");
		expect(emptyTextVariant?.id).toBe("de-variant-empty-text");

		// Test that they have content now
		expect(emptyArrayVariant?.pattern).toHaveLength(1);
		expect(emptyTextVariant?.pattern).toHaveLength(1);

		// Make sure the text is not empty anymore
		expect((emptyArrayVariant?.pattern?.[0] as Text).value).not.toBe("");
		expect((emptyTextVariant?.pattern?.[0] as Text).value).not.toBe("");
	}
);
