import { test, expect } from "vitest";
import { compileBundle } from "./compile-bundle.js";
import type { BundleNested } from "@inlang/sdk";
import { toSafeModuleId } from "./safe-module-id.js";

test("compiles to jsdoc", async () => {
	const mockBundle: BundleNested = {
		id: "blue_moon_bottle",
		declarations: [{ type: "input-variable", name: "age" }],
		messages: [
			{
				id: "message-id",
				bundleId: "blue_moon_bottle",
				locale: "en",
				selectors: [],
				variants: [
					{
						id: "1",
						messageId: "message-id",
						matches: [],
						pattern: [
							{ type: "text", value: "Hello" },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "age" },
							},
						],
					},
				],
			},
		],
	};

	const result = compileBundle({
		fallbackMap: {
			en: "en",
			"en-US": "en",
		},
		bundle: mockBundle,
		messageReferenceExpression: (locale) =>
			`${toSafeModuleId(locale)}.blue_moon_bottle`,
	});

	expect(result.bundle.code).toMatchInlineSnapshot(
		`"/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. \`en.json\`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{ age: NonNullable<unknown> }} inputs
* @param {{ locale?: "en" | "en-US" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
export const blue_moon_bottle = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) return /** @type {any} */ (globalThis).__paraglide_ssr.blue_moon_bottle(inputs) 
	const locale = options.locale ?? getLocale()
	trackMessageCall("blue_moon_bottle", locale)
	if (locale === "en") return en.blue_moon_bottle(inputs)
	if (locale === "en-US") return en_us.blue_moon_bottle(inputs)
	return "blue_moon_bottle"
};"`
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/285
test("compiles bundles with arbitrary module identifiers", async () => {
	const mockBundle: BundleNested = {
		id: "$p@44🍌",
		declarations: [{ type: "input-variable", name: "age" }],
		messages: [
			{
				id: "message-id",
				bundleId: "$p@44🍌",
				locale: "en",
				selectors: [],
				variants: [
					{
						id: "1",
						messageId: "message-id",
						matches: [],
						pattern: [
							{ type: "text", value: "Hello" },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "age" },
							},
						],
					},
				],
			},
		],
	};

	const result = compileBundle({
		fallbackMap: {},
		bundle: mockBundle,
		messageReferenceExpression: (locale) =>
			`${toSafeModuleId(locale)}.blue_moon_bottle`,
	});

	expect(result.bundle.code).includes(
		`export { ${toSafeModuleId("$p@44🍌")} as "$p@44🍌" }`
	);
});
