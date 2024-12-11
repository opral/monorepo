import { describe, it, expect } from "vitest"
import { generateDTSFiles } from "./dts.js"

describe("generateDTSFiles", () => {
	it("works", () => {
		const inputs = {
			"runtime.js": `
/**
 * The project's available language tags.
 *
 * @example
 *   if (availableLanguageTags.includes(userSelectedLanguageTag) === false){
 *     throw new Error("Language tag not available")
 *   }
 */
export const availableLanguageTags = /** @type {const} */ (["en","de"]);

/**
 * @typedef {(typeof availableLanguageTags)[number]} AvailableLanguageTag
 */
            `,
			"messages.js": `
                import * as runtime from "./runtime.js";
                export const my_mesage = () => "Hello World";
            `,
		}

		const dts = generateDTSFiles(inputs)

		expect(dts).toMatchInlineSnapshot(`
			{
			  "messages.d.ts": "/* eslint-disable */
			export function my_mesage(): string;
			",
			  "runtime.d.ts": "/* eslint-disable */
			/**
			 * The project's available language tags.
			 *
			 * @example
			 *   if (availableLanguageTags.includes(userSelectedLanguageTag) === false){
			 *     throw new Error(\\"Language tag not available\\")
			 *   }
			 */
			export const availableLanguageTags: readonly [\\"en\\", \\"de\\"];
			export type AvailableLanguageTag = (typeof availableLanguageTags)[number];
			",
			}
		`)
	})
})
