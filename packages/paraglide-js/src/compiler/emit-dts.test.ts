import { test, expect } from "vitest";
import { emitDts } from "./emit-dts.js";

test("emits dts files", () => {
	// mock paraglide js input of a project
	const inputs = {
		"runtime.js": `
/**
 * Some comment
 */
export const availableLocales = /** @type {const} */ (["en","de"]);

/**
 * @typedef {(typeof availableLocales)[number]} AvailableLocale
 */`,
		"messages.js": `
                import * as runtime from "./runtime.js";
                export const my_mesage = () => "Hello World";
            `,
	};

	const dts = emitDts(inputs);

	expect(dts).toMatchInlineSnapshot(
		{
			"messages.d.ts": `/* eslint-disable */
export function my_mesage(): string;
`,
			"runtime.d.ts": `/* eslint-disable */\n/**\n * Some comment\n */\nexport const availableLocales: readonly ["en", "de"];\nexport type AvailableLocale = (typeof availableLocales)[number];\n`,
		},
		`
		{
		  "messages.d.ts": "/* eslint-disable */
		export function my_mesage(): string;
		",
		  "runtime.d.ts": "/* eslint-disable */
		/**
		 * Some comment
		 */
		export const availableLocales: readonly ["en", "de"];
		export type AvailableLocale = (typeof availableLocales)[number];
		",
		}
	`
	);
});
