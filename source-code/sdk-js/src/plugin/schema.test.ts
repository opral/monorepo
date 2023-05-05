import { describe, test, expect } from "vitest"
import { SdkConfigInput, validateSdkConfig } from "./schema.js"

describe("validateSdkConfig", () => {
	test("At least one strategy is required", () => {
		expect(() => {
			validateSdkConfig({
				languageNegotiation: {
					strategies: [],
				},
			} as unknown as SdkConfigInput)
		}).toThrow()
	})

	test("Random fake strategy", () => {
		expect(() => {
			validateSdkConfig({
				languageNegotiation: {
					strategies: [{ something: "wrong" }],
				},
			} as unknown as SdkConfigInput)
		}).toThrow()
	})

	test("Url strategy", () => {
		expect(
			validateSdkConfig({
				languageNegotiation: {
					strategies: [
						{
							type: "url",
						},
					],
				},
			} as unknown as SdkConfigInput),
		).toMatchInlineSnapshot(`
          {
            "languageNegotiation": {
              "strategies": [
                {
                  "type": "url",
                  "variant": {
                    "type": "path",
                  },
                },
              ],
              "strict": false,
            },
          }
        `)
	})

	test("Accept-language strategy", () => {
		expect(
			validateSdkConfig({
				languageNegotiation: {
					strategies: [
						{
							type: "acceptLanguageHeader",
						},
					],
				},
			} as unknown as SdkConfigInput),
		).toMatchInlineSnapshot(`
			{
			  "languageNegotiation": {
			    "strategies": [
			      {
			        "type": "acceptLanguageHeader",
			      },
			    ],
			    "strict": false,
			  },
			}
		`)
	})

	test("Navigator strategy", () => {
		expect(
			validateSdkConfig({
				languageNegotiation: {
					strategies: [
						{
							type: "navigator",
						},
					],
				},
			} as unknown as SdkConfigInput),
		).toMatchInlineSnapshot(`
			{
			  "languageNegotiation": {
			    "strategies": [
			      {
			        "type": "navigator",
			      },
			    ],
			    "strict": false,
			  },
			}
		`)
	})

	test("Local storage strategy", () => {
		expect(
			validateSdkConfig({
				languageNegotiation: {
					strategies: [
						{
							type: "localStorage",
							key: "language",
						},
					],
				},
			} as unknown as SdkConfigInput),
		).toMatchInlineSnapshot(`
			{
			  "languageNegotiation": {
			    "strategies": [
			      {
			        "key": "language",
			        "type": "localStorage",
			      },
			    ],
			    "strict": false,
			  },
			}
		`)
	})
})
