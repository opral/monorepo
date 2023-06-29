import { expect, test } from "vitest"
import { getSupportedLibrary } from "./getSupportedLibrary.js"

// Mock console.log to suppress logs during testing
console.log = () => undefined

const testData = [
	{
		packageName: "@inlang/sdk-js",
		expectedLibrary: "@inlang/sdk-js",
	},
	{
		packageName: "i18next",
		expectedLibrary: "i18next",
	},
	{
		packageName: "typesafe-i18n",
		expectedLibrary: "typesafe-i18n",
	},
	{
		packageName: "someOtherPackage",
		expectedLibrary: "json",
	},
]

for (const { packageName, expectedLibrary } of testData) {
	test(`getSupportedLibrary should return '${expectedLibrary}' when '${packageName}' is installed`, () => {
		const packageJson = {
			dependencies: {
				[packageName]: "1.0.0",
			},
		}

		const result = getSupportedLibrary({ packageJson })

		expect(result).toBe(expectedLibrary)
	})
}
