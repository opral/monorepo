import { describe, it, expect } from "vitest"
import { createNewProject } from "./createNewProject.js"
import { mockRepo } from "@lix-js/client"
import { defaultProjectSettings } from "./defaultProjectSettings.js"
import { loadProject } from "./loadProject.js"
import { createMessage } from "./test-utilities/createMessage.js"

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

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
		const json = await repo.nodeishFs.readFile(`${projectPath}/settings.json`, {
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
		const json = await repo.nodeishFs.readFile(`${projectPath}/settings.json`, {
			encoding: "utf-8",
		})
		const settings = JSON.parse(json)
		expect(settings).toEqual(projectSettings)
		expect(settings).not.toEqual(defaultProjectSettings)
	})

	it("should load the project after creating it", async () => {
		const repo = await mockRepo()

		const projectPath = "/test/project.inlang"
		await createNewProject({
			projectPath,
			repo,
		})

		const project = await loadProject({ projectPath, repo })
		expect(project.errors().length).toBe(0)

		const testMessage = createMessage("test", { en: "test message" })
		project.query.messages.create({ data: testMessage })
		const messages = project.query.messages.getAll()
		expect(messages.length).toBe(1)
		expect(messages[0]).toEqual(testMessage)

		await sleep(20)

		const json = await repo.nodeishFs.readFile("/test/messages/en.json", { encoding: "utf-8" })
		const jsonMessages = JSON.parse(json)
		expect(jsonMessages["test"]).toEqual("test message")
	})
})
