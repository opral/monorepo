import { it, expect } from "vitest"
import { compileBundle } from "./compileBundle.js"
import { createBundle, createMessage } from "@inlang/sdk2"

it("should compile a bundle", () => {
	const bundleId = "my_bundle"
	const bundle = createBundle({
		id: bundleId,
		messages: [
			createMessage({
				bundleId,
				locale: "en",
				text: "Hello World!",
			}),
			createMessage({
				bundleId,
				locale: "de",
				text: "Hallo Welt!",
			}),
		],
	})

	const output = compileBundle(bundle, {
		en: undefined,
		de: "en",
	})
	expect(output).toMatchInlineSnapshot(`
		{
		  "bundle": {
		    "code": "/**
		 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
		 *
		 * - Don't edit the message's code. Use [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension),
		 *   the [web editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) instead, or edit the translation files manually.
		 * 
		 * - The params are NonNullable<unknown> because the inlang SDK does not provide information on the type of a param (yet).
		 * 
		 * @param {{}} inputs
		 * @param {{ languageTag?: \\"en\\" | \\"de\\" }} options
		 * @returns {string}
		 */
		/* @__NO_SIDE_EFFECTS__ */
		export const my_bundle = (params = {}, options = {}) => {
			return {
				de: de.my_bundle,
				en: en.my_bundle
			}[options.languageTag ?? languageTag()]()
		}

		",
		    "typeRestrictions": {},
		  },
		  "messages": {
		    "de": {
		      "code": "() => \`Hallo Welt!\`",
		      "typeRestrictions": {},
		    },
		    "en": {
		      "code": "() => \`Hello World!\`",
		      "typeRestrictions": {},
		    },
		  },
		}
	`)
})
