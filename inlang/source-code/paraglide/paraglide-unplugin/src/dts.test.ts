import { describe, it, expect } from "vitest"
import { generateDTS } from "./dts.js"

describe("generateDTS", () => {
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

		const dts = generateDTS(inputs, "$paraglide")
		expect(dts).toMatchInlineSnapshot(`
			"declare module \\"$paraglide/runtime.js\\" {/**
			 * The project's available language tags.
			 *
			 * @example
			 *   if (availableLanguageTags.includes(userSelectedLanguageTag) === false){
			 *     throw new Error(\\"Language tag not available\\")
			 *   }
			 */
			export const availableLanguageTags: readonly [\\"en\\", \\"de\\"];
			export type AvailableLanguageTag = (typeof availableLanguageTags)[number];
			}

			declare module \\"$paraglide/messages.js\\" {export function my_mesage(): string;
			}"
		`)
	})
})
