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
})
