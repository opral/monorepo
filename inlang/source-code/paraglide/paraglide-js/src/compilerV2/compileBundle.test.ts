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
		 *   [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) instead, or edit the translation files manually.
		 * 
		 * @param {{}} inputs
		 * @param {{ languageTag?: \\"en\\" | \\"de\\" }} options
		 * @returns {string}
		 */
		/* @__NO_SIDE_EFFECTS__ */
		export const my_bundle = (inputs = {}, options = {}) => {
			return {
				de: de.my_bundle,
				en: en.my_bundle
			}[options.languageTag ?? languageTag()]()
		}

		",
		    "source": {
		      "alias": {},
		      "id": "my_bundle",
		      "messages": [
		        {
		          "bundleId": "my_bundle",
		          "declarations": [],
		          "id": "e6f94263-7364-4414-bef0-19bb72e5a183",
		          "locale": "en",
		          "selectors": [],
		          "variants": [
		            {
		              "id": "2fea4950-2cad-43c3-9439-72a2a8e4a9de",
		              "match": {},
		              "messageId": "e6f94263-7364-4414-bef0-19bb72e5a183",
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
		          "id": "0b712644-2dba-4326-ad5b-347e0d82999d",
		          "locale": "de",
		          "selectors": [],
		          "variants": [
		            {
		              "id": "89834b0b-7fc3-441e-a99d-d3da53b9e15d",
		              "match": {},
		              "messageId": "0b712644-2dba-4326-ad5b-347e0d82999d",
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
		    "typeRestrictions": {},
		  },
		  "messages": {
		    "de": {
		      "code": "/**
		 * 
		 * @returns {string}
		 */
		/* @__NO_SIDE_EFFECTS__ */
		const _0b712644_2dba_4326_ad5b_347e0d82999d = () => \`Hallo Welt!\`",
		      "source": {
		        "bundleId": "my_bundle",
		        "declarations": [],
		        "id": "0b712644-2dba-4326-ad5b-347e0d82999d",
		        "locale": "de",
		        "selectors": [],
		        "variants": [
		          {
		            "id": "89834b0b-7fc3-441e-a99d-d3da53b9e15d",
		            "match": {},
		            "messageId": "0b712644-2dba-4326-ad5b-347e0d82999d",
		            "pattern": [
		              {
		                "type": "text",
		                "value": "Hallo Welt!",
		              },
		            ],
		          },
		        ],
		      },
		      "typeRestrictions": {},
		    },
		    "en": {
		      "code": "/**
		 * 
		 * @returns {string}
		 */
		/* @__NO_SIDE_EFFECTS__ */
		const e6f94263_7364_4414_bef0_19bb72e5a183 = () => \`Hello World!\`",
		      "source": {
		        "bundleId": "my_bundle",
		        "declarations": [],
		        "id": "e6f94263-7364-4414-bef0-19bb72e5a183",
		        "locale": "en",
		        "selectors": [],
		        "variants": [
		          {
		            "id": "2fea4950-2cad-43c3-9439-72a2a8e4a9de",
		            "match": {},
		            "messageId": "e6f94263-7364-4414-bef0-19bb72e5a183",
		            "pattern": [
		              {
		                "type": "text",
		                "value": "Hello World!",
		              },
		            ],
		          },
		        ],
		      },
		      "typeRestrictions": {},
		    },
		  },
		}
	`)
})
