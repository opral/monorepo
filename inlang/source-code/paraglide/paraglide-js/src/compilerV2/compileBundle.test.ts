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
		          "id": "c35d5203-874a-4c6c-82f2-e3e9938c79d6",
		          "locale": "en",
		          "selectors": [],
		          "variants": [
		            {
		              "id": "a223b171-a7c3-4f1d-94f3-a454f64f6258",
		              "match": {},
		              "messageId": "c35d5203-874a-4c6c-82f2-e3e9938c79d6",
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
		          "id": "07c7eed7-f2dc-43d4-8fdd-ac0d506d8e4a",
		          "locale": "de",
		          "selectors": [],
		          "variants": [
		            {
		              "id": "c99f32d2-92ff-4427-9e51-d75d170d65ba",
		              "match": {},
		              "messageId": "07c7eed7-f2dc-43d4-8fdd-ac0d506d8e4a",
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
		const _07c7eed7_f2dc_43d4_8fdd_ac0d506d8e4a = () => \`Hallo Welt!\`",
		      "source": {
		        "bundleId": "my_bundle",
		        "declarations": [],
		        "id": "07c7eed7-f2dc-43d4-8fdd-ac0d506d8e4a",
		        "locale": "de",
		        "selectors": [],
		        "variants": [
		          {
		            "id": "c99f32d2-92ff-4427-9e51-d75d170d65ba",
		            "match": {},
		            "messageId": "07c7eed7-f2dc-43d4-8fdd-ac0d506d8e4a",
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
		const c35d5203_874a_4c6c_82f2_e3e9938c79d6 = () => \`Hello World!\`",
		      "source": {
		        "bundleId": "my_bundle",
		        "declarations": [],
		        "id": "c35d5203-874a-4c6c-82f2-e3e9938c79d6",
		        "locale": "en",
		        "selectors": [],
		        "variants": [
		          {
		            "id": "a223b171-a7c3-4f1d-94f3-a454f64f6258",
		            "match": {},
		            "messageId": "c35d5203-874a-4c6c-82f2-e3e9938c79d6",
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
