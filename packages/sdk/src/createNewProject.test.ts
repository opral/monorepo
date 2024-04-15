import { describe, it, expect } from "vitest"
import { createNewProject } from "./createNewProject.js"
import { mockRepo } from "@lix-js/client"
import { defaultProjectSettings } from "./defaultProjectSettings.js"

describe("createNewProject", () => {
	it("should throw if a path does not end with .inlang", async () => {
		try {
			await createNewProject({
				projectPath: "/boom/ba/da/bang",
				repo: await mockRepo(),
			})
			throw new Error("Expected an error")
		} catch (e) {
			expect((e as Error).message).toMatch(
				'Expected a path ending in "{name}.inlang" but received '
			)
		}
	})

	it("should throw if projectPath is not an absolute path", async () => {
		try {
			const repo = await mockRepo()
			const projectPath = "test/project.inlang"
			await createNewProject({
				projectPath,
				repo,
			})
			throw new Error("Expected an error")
		} catch (e) {
			expect((e as Error).message).toMatch("Expected an absolute path but received")
		}
	})

	it("should throw if the path already exists", async () => {
		try {
			const repo = await mockRepo()
			const projectPath = "/test/project.inlang"
			await repo.nodeishFs.mkdir(projectPath, { recursive: true })
			await createNewProject({
				projectPath,
				repo,
			})
			throw new Error("Expected an error")
		} catch (e) {
			expect((e as Error).message).toMatch("projectPath already exists")
		}
	})

	it("should create default defaultProjectSettings in projectPath", async () => {
		const repo = await mockRepo()
		const projectPath = "/test/project.inlang"
		await createNewProject({
			projectPath,
			repo,
		})
		const json = await repo.nodeishFs.readFile(`${projectPath}/project-settings.json`, {
			encoding: "utf-8",
		})
		const settings = JSON.parse(json)
		expect(settings).toEqual(defaultProjectSettings)
	})

	it("should create different projectSettings in projectPath", async () => {
		const repo = await mockRepo()
		const projectPath = "/test/project.inlang"
		const projectSettings = { ...defaultProjectSettings, languageTags: ["en", "de", "fr"] }
		await createNewProject({
			projectPath,
			repo,
			projectSettings,
		})
		const json = await repo.nodeishFs.readFile(`${projectPath}/project-settings.json`, {
			encoding: "utf-8",
		})
		const settings = JSON.parse(json)
		expect(settings).toEqual(projectSettings)
		expect(settings).not.toEqual(defaultProjectSettings)
	})
})
