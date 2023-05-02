import { describe, test, expect } from "vitest"
import { SdkConfig, validateSdkConfig } from "./schema.js"

describe("validateSdkConfig", () => {
	test("At least one strategy is required", () => {
		expect(() => {
			validateSdkConfig({
				languageNegotiation: {
					strategies: [],
				},
			} as unknown as SdkConfig)
		}).toThrow()
	})

	test("Random fake strategy", () => {
		expect(() => {
			validateSdkConfig({
				languageNegotiation: {
					strategies: [{ something: "wrong" }],
				},
			} as unknown as SdkConfig)
		}).toThrow()
	})

	test("Valid config", () => {
		expect(
			validateSdkConfig({
				languageNegotiation: {
					strategies: [
						{
							type: "url",
							variant: {
								type: "path",
							},
						},
					],
				},
			}),
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
})
