import { createNodeishMemoryFs } from "@lix-js/fs"
import { expect, it } from "vitest"
import { getSupportedLibrary, tryAutoGenProjectSettings } from "./tryAutoGenProjectSettings.js"
import path from "node:path"

it("should generate project configuration successfully", async () => {
	// Mock the contents of package.json
	const packageJsonContent = JSON.stringify({
		dependencies: {
			i18next: "^1.2.3", // Simulate the presence of i18next as a dependency
		},
		devDependencies: {},
	})

	// Create a mock NodeishFilesystem with an package.json
	const nodeishFs = createNodeishMemoryFs()

	nodeishFs.writeFile("/package.json", packageJsonContent)

	// create resources folder with en.json and de.json with dummy content
	nodeishFs.mkdir("/resources")
	nodeishFs.writeFile("/resources/en.json", JSON.stringify({ key: "value" }))
	nodeishFs.writeFile("/resources/de.json", JSON.stringify({ key: "wert" }))

	// mock project settings file with plugin in project.inlang.json
	// const projectSettings = JSON.stringify({
	// 	modules: ["https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4"],
	// 	sourceLanguageTag: "en",
	// 	languageTags: ["en", "de"],
	// 	settings: {
	// 		"plugin.inlang.i18next": {
	// 			pathPattern: "./inlang/source-code/website/lang/{languageTag}.json",
	// 		},
	// 	},
	// } as ProjectSettings)

	// nodeishFs.writeFile("/project.inlang.json", projectSettings)

	// Call the function with the mock dependencies
	const result = await tryAutoGenProjectSettings({
		nodeishFs,
		pathJoin: path.join,
	})

	// Add your assertions here based on the expected behavior of the function
	// For example, you can check if the result contains the expected properties or values
	expect(result.warnings).toEqual([
		"🗂️  Found language folder path: 'resources/{languageTag}.json', please adjust the pathPattern\nin the project.inlang.json manually if it is not parsed correctly.",
	])

	expect(result.settings).toStrictEqual({
		$schema: "https://inlang.com/schema/project-settings",
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: [
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
		],
		"plugin.inlang.i18next": { pathPattern: "resources/{languageTag}.json" },
	})
})

it("should handle errors and return warnings if no matching dependency is found", async () => {
	// Mock the contents of package.json
	const packageJsonContent = JSON.stringify({
		dependencies: {},
		devDependencies: {},
	})

	// Create a mock NodeishFilesystem with an package.json
	const nodeishFs = createNodeishMemoryFs()

	nodeishFs.writeFile("/package.json", packageJsonContent)

	// Call the function with the mock dependencies
	const result = await tryAutoGenProjectSettings({
		nodeishFs,
		pathJoin: path.join,
	})

	// Add your assertions here based on the expected behavior of the function
	// For example, you can check if the result contains the expected properties or values
	expect(result.warnings).toEqual([
		"📦 Using fallback plugin: json, because no other configuration was found.",
		"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
	])

	// check if settings are returned
	expect(result.settings).toStrictEqual({
		$schema: "https://inlang.com/schema/project-settings",
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: [
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
		],
		"plugin.inlang.json": { pathPattern: "" },
	})
})

it("should choose i18next as the plugin when it's a dependency", async () => {
	// Arrange
	const packageJsonContent = JSON.stringify({
		dependencies: {
			i18next: "^1.2.3", // Simulate the presence of i18next as a dependency
		},
		devDependencies: {},
	})

	const nodeishFs = createNodeishMemoryFs()
	nodeishFs.writeFile("/package.json", packageJsonContent)

	// Act
	const result = await getSupportedLibrary({
		packageJson: JSON.parse(packageJsonContent),
	})

	// Assert
	expect(result.modules).toContain("i18next")
})
