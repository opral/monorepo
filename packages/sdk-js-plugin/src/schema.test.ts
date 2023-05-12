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
			}
		`)
	})
})
