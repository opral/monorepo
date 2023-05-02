import { describe, test, expect } from "vitest"
import { validateSdkConfig } from "./schema.js"

describe("validateSdkConfig", () => {
	test("At least one strategy is required", () => {
		expect(() => {
			validateSdkConfig({
				languageNegotiation: {
					strict: true,
					// @ts-ignore - intentionally invalid
					strategies: [],
				},
			})
		}).toThrow()
	})

	test("Random fake strategy", () => {
		expect(() => {
			validateSdkConfig({
				languageNegotiation: {
					strict: true,
					// @ts-ignore - intentionally invalid
					strategies: [{ something: "wrong" }],
				},
			})
		}).toThrow()
	})

    test("Valid config", () => {
        expect(
            validateSdkConfig({
                languageNegotiation: {
                    strict: true,
                    strategies: [{
                        type: "url",
                        variant: {
                            type: "path",
                        }
                    }],
                },
            })
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
              "strict": true,
            },
          }
        `)
    })
})
