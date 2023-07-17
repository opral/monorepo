import { describe, test, expect } from "vitest"
import { SdkConfigInput, validateSdkConfig } from "./schema.js"

describe("validateSdkConfig", () => {
	describe("languageNegotiation", () => {
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
				  "debug": false,
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
				  "resources": {
				    "cache": "build-time",
				  },
				  "routing": {
				    "exclude": [],
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
				  "debug": false,
				  "languageNegotiation": {
				    "strategies": [
				      {
				        "type": "acceptLanguageHeader",
				      },
				    ],
				    "strict": false,
				  },
				  "resources": {
				    "cache": "build-time",
				  },
				  "routing": {
				    "exclude": [],
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
				  "debug": false,
				  "languageNegotiation": {
				    "strategies": [
				      {
				        "type": "navigator",
				      },
				    ],
				    "strict": false,
				  },
				  "resources": {
				    "cache": "build-time",
				  },
				  "routing": {
				    "exclude": [],
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
				  "debug": false,
				  "languageNegotiation": {
				    "strategies": [
				      {
				        "key": "language",
				        "type": "localStorage",
				      },
				    ],
				    "strict": false,
				  },
				  "resources": {
				    "cache": "build-time",
				  },
				  "routing": {
				    "exclude": [],
				  },
				}
			`)
		})
	})


	describe("routing", () => {
		const baseConfig = { languageNegotiation: { strategies: [{ type: "navigator" }] } } as SdkConfigInput

		test("should not require a 'routing' prop", () => {
			expect(validateSdkConfig({
				...baseConfig,
			})).toMatchInlineSnapshot(`
				{
				  "debug": false,
				  "languageNegotiation": {
				    "strategies": [
				      {
				        "type": "navigator",
				      },
				    ],
				    "strict": false,
				  },
				  "resources": {
				    "cache": "build-time",
				  },
				  "routing": {
				    "exclude": [],
				  },
				}
			`)
		})

		describe("exclude", () => {
			test("should not require an 'exclude' prop", () => {
				expect(validateSdkConfig({
					...baseConfig,
					routing: {},
				})).toMatchInlineSnapshot(`
					{
					  "debug": false,
					  "languageNegotiation": {
					    "strategies": [
					      {
					        "type": "navigator",
					      },
					    ],
					    "strict": false,
					  },
					  "resources": {
					    "cache": "build-time",
					  },
					  "routing": {
					    "exclude": [],
					  },
					}
				`)
			})

			test("should accept relative urls", () => {
				expect(validateSdkConfig({
					...baseConfig,
					routing: {
						exclude: ['/assets', '/api'],
					},
				})).toMatchInlineSnapshot(`
					{
					  "debug": false,
					  "languageNegotiation": {
					    "strategies": [
					      {
					        "type": "navigator",
					      },
					    ],
					    "strict": false,
					  },
					  "resources": {
					    "cache": "build-time",
					  },
					  "routing": {
					    "exclude": [
					      "/assets",
					      "/api",
					    ],
					  },
					}
				`)
			})

			test("should fail if entry is not a relative url", () => {
				expect(() => validateSdkConfig({
					...baseConfig,
					routing: {
						exclude: ['api'],
					},
				})).toThrow()
			})
		})
	})
})
