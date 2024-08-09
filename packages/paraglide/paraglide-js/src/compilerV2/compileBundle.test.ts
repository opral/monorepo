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

	const output = compileBundle(bundle, {})
	expect(output).toMatchInlineSnapshot(`
		{
		  "index": "/**
		 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
		 *
		 * - Don't edit the message's code. Use [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension),
		 *   the [web editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) instead, or edit the translation files manually.
		 * 
		 * - The params are NonNullable<unknown> because the inlang SDK does not provide information on the type of a param (yet).
		 * 
		 * @param {{}} inputs
		 * @param {{ languageTag?:  }} options
		 * @returns {string}
		 */
		/* @__NO_SIDE_EFFECTS__ */
		export const my_bundle = (params = {}, options = {}) => {
			return {

			}[options.languageTag ?? languageTag()]()
		}

		",
		  "params": {},
		  "source": {
		    "alias": {},
		    "id": "my_bundle",
		    "messages": [
		      {
		        "bundleId": "my_bundle",
		        "declarations": [],
		        "id": "bae86d48-00b4-48aa-bd61-412069820232",
		        "locale": "en",
		        "selectors": [],
		        "variants": [
		          {
		            "id": "ccacd7c1-8726-4816-ba46-5f576d13788d",
		            "match": {},
		            "messageId": "bae86d48-00b4-48aa-bd61-412069820232",
		            "pattern": [
		              {
		                "type": "text",
		                "value": "Hello World!",
		              },
		            ],
		          },
		        ],
		      },
		      {
		        "bundleId": "my_bundle",
		        "declarations": [],
		        "id": "afe342bc-c499-4e59-9590-1956dce95b1c",
		        "locale": "de",
		        "selectors": [],
		        "variants": [
		          {
		            "id": "932af88a-afe7-4f08-9e93-598ff40bd50c",
		            "match": {},
		            "messageId": "afe342bc-c499-4e59-9590-1956dce95b1c",
		            "pattern": [
		              {
		                "type": "text",
		                "value": "Hallo Welt!",
		              },
		            ],
		          },
		        ],
		      },
		    ],
		  },
		  "translations": {},
		}
	`)
})
