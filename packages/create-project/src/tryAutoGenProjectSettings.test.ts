import { createNodeishMemoryFs } from "@lix-js/fs"
import { expect, test, describe, vi } from "vitest"
import { tryAutoGenProjectSettings } from "./tryAutoGenProjectSettings.js"
import { loadProject } from "@inlang/sdk"

test("it should not write to the filesystem which would lead to unexpected behaviour for users", async () => {
	const nodeishFs = createNodeishMemoryFs()
	nodeishFs.writeFile = vi.fn()
	await tryAutoGenProjectSettings({
		nodeishFs,
		basePath: "/",
	})
	expect(nodeishFs.writeFile).not.toHaveBeenCalled()
})

test("it should return undefined if the settings can't be generated", async () => {
	const nodeishFs = createNodeishMemoryFs()
	const result = await tryAutoGenProjectSettings({
		nodeishFs,
		basePath: "/",
	})
	expect(result).toBeUndefined()
})

describe("i18next", () => {
	test("pathPattern: '/resources/{languageTag}'", async () => {
		const nodeishFs = createNodeishMemoryFs()

		const mockPackageJson = JSON.stringify({
			dependencies: {
				i18next: "^1.2.3",
			},
			devDependencies: {},
		})

		await nodeishFs.writeFile("/package.json", mockPackageJson)
		await nodeishFs.mkdir("/resources")
		await nodeishFs.writeFile("/resources/en.json", JSON.stringify({ mockMessage: "Hello world" }))
		await nodeishFs.writeFile("/resources/de.json", JSON.stringify({ mockMessage: "Hallo Welt" }))

		const settings = await tryAutoGenProjectSettings({
			nodeishFs,
			basePath: "/",
		})

		await nodeishFs.writeFile("/project.inlang.json", JSON.stringify(settings))

		const project = await loadProject({
			projectPath: "/project.inlang.json",
			nodeishFs,
		})

		expect(project.errors()).toEqual([])
		expect(project.settings().languageTags).toEqual(["en", "de"])
		expect(project.query.messages.includedMessageIds()).toEqual(["mockMessage"])
		expect(
			project.query.messages
				.get({ where: { id: "mockMessage" } })
				.variants.map((v) => v.languageTag)
		).toEqual(["en", "de"])
	})
})
