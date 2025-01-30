import { test, expect } from "vitest";
import { compileBundle } from "./compile-bundle.js";
import type { BundleNested } from "@inlang/sdk";

test("compiles to jsdoc", async () => {
	const result = compileBundle({
		fallbackMap: {
			en: "en",
			"en-US": "en",
		},
		registry: {},
		bundle: mockBundle,
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
const blue_moon_bottle = (inputs, options = {}) => {
	const locale = options.locale ?? getLocale()
	if (locale === "en") return en.blue_moon_bottle(inputs)
	if (locale === "en-US") return en_US.blue_moon_bottle(inputs)
	return "blue_moon_bottle"
}
	
export { blue_moon_bottle }"`
	);
});

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

test("throws if a JS keyword is used as an identifier", async () => {
	expect(() =>
		compileBundle({
			fallbackMap: {},
			registry: {},
			bundle: {
				id: "then",
				declarations: [],
				messages: [],
			},
		})
	).toThrow();
});
