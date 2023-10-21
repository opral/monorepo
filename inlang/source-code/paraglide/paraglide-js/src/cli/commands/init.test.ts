import { test, expect, vi, beforeAll, beforeEach } from "vitest"
import { checkIfPackageJsonExists, findExistingInlangProjectPath } from "./init.js"
import consola from "consola"
import { describe } from "node:test"
import fsSync from "node:fs"
import fs from "node:fs/promises"
import memfs from "memfs"

beforeAll(() => {
	// spy on commonly used functions to prevent console output
	// and allow expecations
	vi.spyOn(consola, "log").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "info").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "success").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "error").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "warn").mockImplementation(() => undefined as never)
	vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
})

beforeEach(() => {
	vi.resetAllMocks()
	// Re-mock consola before each test call to remove calls from before
	consola.mockTypes(() => vi.fn())

	// set the current working directory to some mock value to prevent
	// the tests from failing when running in a different environment
	process.cwd = () => "/"
})

describe("checkIfPackageJsonExists()", () => {
	test("it should exit if no package.json has been found", async () => {
		mockFs({})
		await checkIfPackageJsonExists()
		expect(consola.warn).toHaveBeenCalledOnce()
		expect(process.exit).toHaveBeenCalledOnce()
	})

	test("it should not exit if a package.json exists in the current working directory", async () => {
		mockFs({ "package.json": "" })
		await checkIfPackageJsonExists()
		expect(consola.warn).not.toHaveBeenCalled()
		expect(process.exit).not.toHaveBeenCalled()
	})
})

describe("findExistingInlangProjectPath()", () => {
	test("it should return undefined if no project.inlang.json has been found", async () => {
		mockFs({})
		const path = await findExistingInlangProjectPath()
		expect(path).toBeUndefined()
	})

	test("it find a project in the current working directory", async () => {
		process.cwd = () => "/"
		mockFs({ "project.inlang.json": "{}" })
		const path = await findExistingInlangProjectPath()
		expect(path).toBe("./project.inlang.json")
	})

	test("it should find a project in a parent directory", async () => {
		process.cwd = () => "/nested/"

		mockFs({
			"/project.inlang.json": "{}",
			"/nested/": {},
		})
		const path = await findExistingInlangProjectPath()
		expect(path).toBe("../project.inlang.json")
	})

	test("it should find a project in a parent parent directory", async () => {
		process.cwd = () => "/nested/nested/"
		mockFs({
			"/project.inlang.json": "{}",
			"/nested/nested/": {},
		})
		const path = await findExistingInlangProjectPath()
		expect(path).toBe("../../project.inlang.json")
	})
})

// test("it should log true if the user has an existing project", async () => {
// 	mockUserInput([true])
// 	await initCommand.parseAsync()
// 	expect(consola.log).toHaveBeenLastCalledWith(true)
// })

// test("it should log false if the user has an existing project", async () => {
// 	mockUserInput([false])
// 	await initCommand.parseAsync()
// 	expect(consola.log).toHaveBeenLastCalledWith(false)
// })

// test("the paraglide plugin for vscode should be installed", () => {
// 	throw new Error("Not implemented")
// })

// test("it sets the tsconfig compiler option 'moduleResolution' to 'bundler'", () => {
// 	throw new Error("Not implemented")
// })

// test("it should create a project if it doesn't exist", () => {
// 	test("the inlang message format should be the default selection", () => {
// 		throw new Error("Not implemented")
// 	})
// })

// test("the vscode extension should be added to the workspace recommendations", () => {
// 	test("automatically if the .vscode folder exists", () => {
// 		throw new Error("Not implemented")
// 	})
// 	test("else, the user should be prompted if the vscode extension should be added", () => {
// 		throw new Error("Not implemented")
// 	})
// })

// describe("it should prompt the user if the cli should be added for linting and machine translations", () => {
// 	test("the cli should be added to the devDependencies", () => {
// 		throw new Error("Not implemented")
// 	})
// 	test("if a lint script exists, inlang lint should be added to the lint script", () => {
// 		throw new Error("Not implemented")
// 	})
// 	test("if no lint script exists, the lint script should be created in the package.json", () => {
// 		throw new Error("Not implemented")
// 	})
// })

// test("the user should be prompted for the framework and forwarded to the corresponding guide", () => {
// 	throw new Error("Not implemented")
// })

// --- SETUP TEST INPUT CONSUMER ---
const mockUserInput = (testUserInput: any[]) => {
	vi.spyOn(consola, "prompt").mockImplementation(() => {
		const value = testUserInput.shift()
		if (value === undefined) {
			throw new Error("End of test input")
		}
		return value
	})
}

const mockFs = (files: memfs.NestedDirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON(files))
	vi.spyOn(fsSync, "existsSync").mockImplementation(_memfs.existsSync)
	for (const prop in fs) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof fs[prop] !== "function") continue
		// @ts-ignore - memfs has the same interface as node:fs/promises
		vi.spyOn(fs, prop).mockImplementation(_memfs.promises[prop])
	}
}


test("a tsconfig with comments should be loaded correctly", () => {})