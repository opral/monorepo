import { randomUUID } from "node:crypto"
import { expect, test } from "vitest"
import { getLatestVersion } from "./getLatestVersion.js"

// Test setup
const packages = [
	"@inlang/plugin-standard-lint-rules",
	"@inlang/plugin-json",
	"@inlang/plugin-i18next",
	"@inlang/sdk-js",
	"typesafe-i18n",
]

// Test case for each package
for (const packageName of packages) {
	test(`getLatestVersion - ${packageName}`, async () => {
		const version = await getLatestVersion(packageName)

		// Assert that the version is a string containing only digits
		expect(typeof version).toBe("string")
		expect(version).toMatch(/^\d+$/)
	})
}

// Test case for successful fetch
test("getLatestVersion - Successful Fetch", async () => {
	const packageName = "@inlang/plugin-json"
	const version = await getLatestVersion(packageName)

	// Assert that the version is extracted correctly
	expect(version).toMatch(/^\d+$/)
})

// Test case for invalid package name
test("getLatestVersion - Invalid Package Name", async () => {
	const packageName = randomUUID()
	const version = await getLatestVersion(packageName)

	// Assert that the function returns undefined
	expect(version).toBe("latest")
})

// Test case for missing latest version
test("getLatestVersion - Missing Latest Version", async () => {
	const packageName = randomUUID()
	const version = await getLatestVersion(packageName)

	// Assert that the function returns undefined
	expect(version).toBe("latest")
})
