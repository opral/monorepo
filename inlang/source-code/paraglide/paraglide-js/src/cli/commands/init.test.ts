import { test, expect, vi, beforeAll, beforeEach } from "vitest"
import {
	addCompileStepToPackageJSON,
	addParaglideJsToDependencies,
	maybeChangeTsConfigAllowJs,
	maybeChangeTsConfigModuleResolution,
	checkIfPackageJsonExists,
	checkIfUncommittedChanges,
	createNewProjectFlow,
	existingProjectFlow,
	findExistingInlangProjectPath,
	initializeInlangProject,
	maybeAddVsCodeExtension,
	newProjectTemplate,
} from "./init.js"
import consola from "consola"
import { describe } from "node:test"
import fsSync from "node:fs"
import fs from "node:fs/promises"
import childProcess from "node:child_process"
import memfs from "memfs"
import type { ProjectSettings } from "@inlang/sdk"
import { version } from "../state.js"

beforeAll(() => {
	// spy on commonly used functions to prevent console output
	// and allow expecations
	vi.spyOn(consola, "log").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "info").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "success").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "error").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "warn").mockImplementation(() => undefined as never)
})

beforeEach(() => {
	vi.resetAllMocks()
	// Re-mock consola before each test call to remove calls from before
	consola.mockTypes(() => vi.fn())

	// set the current working directory to some mock value to prevent
	// the tests from failing when running in a different environment
	process.cwd = () => "/"
})

describe("end to end tests", () => {
	test("it should exit if the user presses CTRL+C", async () => {
		mockFiles({})
		mockUserInput([
			// the first user input is CTRL+C
			() => process.emit("SIGINT", "SIGINT"),
		])
		// simulating a throw to exit the command early without
		// killing the process the test runs in
		vi.spyOn(process, "exit").mockImplementation(() => {
			throw "process.exit"
		})
		try {
			await checkIfPackageJsonExists()
		} catch (e) {
			expect(e).toBe("process.exit")
		}
		expect(process.exit).toHaveBeenCalledOnce()
	})
})

describe("initializeInlangProject()", () => {
	test(
		"it should execute existingProjectFlow() if a project has been found",
		async () => {
			mockFiles({
				"/folder/project.inlang.json": JSON.stringify(newProjectTemplate),
				"/folder/subfolder": {},
			})
			process.cwd = () => "/folder/subfolder"
			mockUserInput(["useExistingProject"])
			const path = await initializeInlangProject()
			expect(path).toBe("../project.inlang.json")
		},
		{
			// i am on a plane with bad internet
			timeout: 20000,
		}
	)
	test("it should execute newProjectFlow() if no project has been found", async () => {
		const { existsSync } = mockFiles({})
		mockUserInput(["newProject"])
		const path = await initializeInlangProject()
		expect(path).toBe("./project.inlang.json")
		expect(existsSync("./project.inlang.json")).toBe(true)
	})
})

describe("addParaglideJsToDependencies()", () => {
	test("it should add paraglide-js to the dependencies with the latest version", async () => {
		mockFiles({
			"/package.json": "{}",
		})
		await addParaglideJsToDependencies()
		expect(fs.writeFile).toHaveBeenCalledOnce()
		expect(consola.success).toHaveBeenCalledOnce()
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.dependencies["@inlang/paraglide-js"]).toBe(version)
	})
})

describe("addCompileStepToPackageJSON()", () => {
	test("if no scripts exist, it should add scripts.build", async () => {
		mockFiles({
			"/package.json": "{}",
		})
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang.json",
		})
		expect(fs.writeFile).toHaveBeenCalledOnce()
		expect(consola.success).toHaveBeenCalledOnce()
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.build).toBe(`paraglide-js compile --project ./project.inlang.json`)
	})

	test("if an existing build step exists, it should be preceeded by the paraglide-js compile command", async () => {
		mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					build: "some build step",
				},
			}),
		})
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang.json",
		})
		expect(fs.writeFile).toHaveBeenCalledOnce()
		expect(consola.success).toHaveBeenCalledOnce()
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.build).toBe(
			`paraglide-js compile --project ./project.inlang.json && some build step`
		)
	})

	test("if a paraglide-js compile step already exists, the user should be prompted to update it manually and exit if the user rejects", async () => {
		mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					build: "paraglide-js compile --project ./project.inlang.json",
				},
			}),
		})
		mockUserInput([
			// user does not want to update the build step
			false,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang.json",
		})
		expect(fs.writeFile).not.toHaveBeenCalled()
		expect(consola.success).not.toHaveBeenCalled()
		expect(consola.warn).toHaveBeenCalledOnce()
		expect(process.exit).toHaveBeenCalled()
	})

	test("if a paraglide-js compile step already exists, the user should be prompted to update it manually and return if they did so", async () => {
		mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					build: "paraglide-js compile --project ./project.inlang.json",
				},
			}),
		})
		mockUserInput([
			// user does not want to update the build step
			true,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang.json",
		})
		expect(fs.writeFile).not.toHaveBeenCalled()
		expect(consola.success).not.toHaveBeenCalled()
		expect(consola.warn).toHaveBeenCalledOnce()
		expect(process.exit).not.toHaveBeenCalled()
	})
})

describe("existingProjectFlow()", () => {
	test("if the user selects to proceed with the existing project and the project has no errors, the function should return", async () => {
		mockFiles({
			"/project.inlang.json": JSON.stringify(newProjectTemplate),
		})
		mockUserInput(["useExistingProject"])
		expect(
			existingProjectFlow({ existingProjectPath: "/project.inlang.json" })
		).resolves.toBeUndefined()
	})

	test("if the user selects new project, the newProjectFlow() should be executed", async () => {
		const { existsSync } = mockFiles({
			"/folder/project.inlang.json": JSON.stringify(newProjectTemplate),
		})
		mockUserInput(["newProject"])

		await existingProjectFlow({ existingProjectPath: "/folder/project.inlang.json" })
		// info that a new project is created
		expect(consola.info).toHaveBeenCalledOnce()
		// the newly created project file should exist
		expect(existsSync("/project.inlang.json")).toBe(true)
	})

	test("it should exit if the existing project contains errors", async () => {
		mockFiles({
			"/project.inlang.json": `BROKEN PROJECT FILE`,
		})
		mockUserInput(["useExistingProject"])
		await existingProjectFlow({ existingProjectPath: "/project.inlang.json" })
		expect(consola.error).toHaveBeenCalled()
		expect(process.exit).toHaveBeenCalled()
	})
})

describe("maybeAddVsCodeExtension()", () => {
	test("it should add the vscode extension if the user uses vscode", async () => {
		mockFiles({
			"/project.inlang.json": JSON.stringify(newProjectTemplate),
		})
		mockUserInput([
			// user uses vscode
			true,
		])
		await maybeAddVsCodeExtension({ projectPath: "/project.inlang.json" })
		expect(consola.prompt).toHaveBeenCalledOnce()
		const extensions = await fs.readFile("/.vscode/extensions.json", {
			encoding: "utf-8",
		})
		expect(extensions).toBe(
			JSON.stringify(
				{
					recommendations: ["inlang.vs-code-extension"],
				},
				undefined,
				2
			)
		)
	})
	test("it should not add the vscode extension if the user doesn't use vscode", async () => {
		mockFiles({
			"/project.inlang.json": JSON.stringify(newProjectTemplate),
		})
		mockUserInput([
			// user does not use vscode
			false,
		])
		await maybeAddVsCodeExtension({ projectPath: "/project.inlang.json" })
		expect(consola.prompt).toHaveBeenCalledOnce()
		expect(fs.writeFile).not.toHaveBeenCalled()
	})

	test("it should install the m function matcher if not installed", async () => {
		const withEmptyModules = structuredClone(newProjectTemplate)
		withEmptyModules.modules = []
		mockFiles({
			"/project.inlang.json": JSON.stringify(withEmptyModules),
		})
		mockUserInput([
			// user uses vscode
			true,
		])
		await maybeAddVsCodeExtension({ projectPath: "/project.inlang.json" })
		const projectSettings = JSON.parse(
			await fs.readFile("/project.inlang.json", {
				encoding: "utf-8",
			})
		) as ProjectSettings
		expect(projectSettings.modules.some((m) => m.includes("m-function-matcher"))).toBe(true)
	})
	test("it should create the .vscode folder if not existent", async () => {
		mockFiles({
			"/project.inlang.json": JSON.stringify(newProjectTemplate),
		})
		mockUserInput([
			// user uses vscode
			true,
		])
		await maybeAddVsCodeExtension({ projectPath: "/project.inlang.json" })
		expect(fsSync.existsSync("/.vscode/extensions.json")).toBe(true)
	})
})

describe("createNewProjectFlow()", async () => {
	test(
		"it should succeed in creating a new project",
		async () => {
			const { existsSync } = mockFiles({})
			await createNewProjectFlow()
			// user is informed that a new project is created
			expect(consola.info).toHaveBeenCalledOnce()
			// the project shouldn't have errors
			expect(consola.error).not.toHaveBeenCalled()
			// user is informed that the project has successfully been created
			expect(consola.success).toHaveBeenCalledOnce()
			// the project file should exist
			expect(existsSync("/project.inlang.json")).toBe(true)
		},
		{
			// i am testing this while i am on an airplane with slow internet
			timeout: 20000,
		}
	)
	test("it should exit if the project has errors", async () => {
		mockFiles({})
		// invalid project settings file
		vi.spyOn(JSON, "stringify").mockReturnValue(`{}`)
		await createNewProjectFlow()
		// user is informed that a new project is created
		expect(consola.info).toHaveBeenCalledOnce()
		// the project has errors
		expect(consola.error).toHaveBeenCalled()
		// the commands exits
		expect(process.exit).toHaveBeenCalled()
	})
})

describe("checkIfUncommittedChanges()", () => {
	test("it should not fail if the git cli is not installed", async () => {
		vi.spyOn(childProcess, "execSync").mockImplementation(() => {
			throw Error("Command failed: git status")
		})
		expect(checkIfUncommittedChanges()).resolves.toBeUndefined()
	})

	test("it should continue if no uncomitted changes exist", async () => {
		vi.spyOn(childProcess, "execSync").mockImplementation(() => {
			return Buffer.from("")
		})
		expect(checkIfUncommittedChanges()).resolves.toBeUndefined()
	})

	test("it should prompt the user if there are uncommitted changes and exit if the user doesn't want to continue", async () => {
		vi.spyOn(childProcess, "execSync").mockImplementation(() => {
			return Buffer.from("M package.json")
		})
		const processExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
		mockUserInput([
			// user does not want to continue
			false,
		])
		await checkIfUncommittedChanges()
		expect(consola.info).toHaveBeenCalledOnce()
		expect(consola.prompt).toHaveBeenCalledOnce()
		expect(processExit).toHaveBeenCalledOnce()
	})

	test("it should prompt the user if there are uncommitted changes and return if the user wants to continue", async () => {
		vi.spyOn(childProcess, "execSync").mockImplementation(() => {
			return Buffer.from("M package.json")
		})
		const processExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
		mockUserInput([
			// user does want to continue
			true,
		])
		await checkIfUncommittedChanges()
		expect(consola.info).toHaveBeenCalledOnce()
		expect(consola.prompt).toHaveBeenCalledOnce()
		expect(processExit).not.toHaveBeenCalledOnce()
	})
	test("it should not prompt the user if no uncommitted changes exist", async () => {
		await checkIfUncommittedChanges()
		expect(consola.prompt).not.toHaveBeenCalled()
	})
})

describe("checkIfPackageJsonExists()", () => {
	test("it should exit if no package.json has been found", async () => {
		mockFiles({})
		await checkIfPackageJsonExists()
		expect(consola.warn).toHaveBeenCalledOnce()
		expect(process.exit).toHaveBeenCalledOnce()
	})

	test("it should not exit if a package.json exists in the current working directory", async () => {
		mockFiles({ "package.json": "" })
		await checkIfPackageJsonExists()
		expect(consola.warn).not.toHaveBeenCalled()
		expect(process.exit).not.toHaveBeenCalled()
	})
})

describe("findExistingInlangProjectPath()", () => {
	test("it should return undefined if no project.inlang.json has been found", async () => {
		mockFiles({})
		const path = await findExistingInlangProjectPath()
		expect(path).toBeUndefined()
	})

	test("it find a project in the current working directory", async () => {
		process.cwd = () => "/"
		mockFiles({ "project.inlang.json": "{}" })
		const path = await findExistingInlangProjectPath()
		expect(path).toBe("./project.inlang.json")
	})

	test("it should find a project in a parent directory", async () => {
		process.cwd = () => "/nested/"

		mockFiles({
			"/project.inlang.json": "{}",
			"/nested/": {},
		})
		const path = await findExistingInlangProjectPath()
		expect(path).toBe("../project.inlang.json")
	})

	test("it should find a project in a parent parent directory", async () => {
		process.cwd = () => "/nested/nested/"
		mockFiles({
			"/project.inlang.json": "{}",
			"/nested/nested/": {},
		})
		const path = await findExistingInlangProjectPath()
		expect(path).toBe("../../project.inlang.json")
	})
})

describe("maybeChangeTsConfigModuleResolution()", () => {
	test("it should return if no tsconfig.json exists", async () => {
		mockFiles({})
		const result = await maybeChangeTsConfigModuleResolution()
		// no tsconfig exists, immediately return
		expect(result).toBeUndefined()
		// the tsconfig should not have been read
		expect(fs.readFile).not.toHaveBeenCalled()
		// no info that the moduleResolution needs to be adapted should be logged
		expect(consola.info).not.toHaveBeenCalled()
	})

	test("it should warn if the extended from tsconfig can't be read", async () => {
		mockFiles({
			"/tsconfig.json": `{ 
				"extends": "./non-existend.json",
				"compilerOptions": {
					"moduleResolution": "Bundler"
				} 
			}`,
		})
		await maybeChangeTsConfigModuleResolution()
		// no info that the moduleResolution needs to be adapted should be logged

		expect(consola.warn).toHaveBeenCalledOnce()
	})

	test("it should detect if the extended from tsconfig already set the moduleResolution to bundler to ease the getting started process", async () => {
		mockFiles({
			"/tsconfig.base.json": `{
				"compilerOptions": {
					"moduleResolution": "Bundler"
				}
			}`,
			"/tsconfig.json": `{ 
				"extends": "tsconfig.base.json", 
			}`,
		})
		await maybeChangeTsConfigModuleResolution()
		// no info that the moduleResolution needs to be adapted should be logged
		expect(consola.info).not.toHaveBeenCalled()
	})

	test("it should prompt the user to set the moduleResolution to bundler", async () => {
		mockFiles({
			"/tsconfig.json": `{}`,
		})

		const userAdjustsTsConfigSpy = vi.fn()

		mockUserInput([
			// user confirms that the moduleResolution has been set to bundler
			() => {
				userAdjustsTsConfigSpy()
				fs.writeFile(
					"/tsconfig.json",
					`{
						"compilerOptions": {
							"moduleResolution": "Bundler"
						}
					}`
				)
				return true
			},
		])

		await maybeChangeTsConfigModuleResolution()

		// info that the moduleResolution needs to be adapted
		expect(consola.info).toHaveBeenCalledOnce()
		// prompt the user to set the moduleResolution to bundler
		expect(consola.prompt).toHaveBeenCalledOnce()
		// user has set the moduleResolution to bundler
		expect(userAdjustsTsConfigSpy).toHaveBeenCalledOnce()
	})

	test("it should keep prompting the user to set the moduleResolution to bundler if the moduleResolution has not been set", async () => {
		mockFiles({
			"/tsconfig.json": `{}`,
		})

		mockUserInput([
			// user confirms that the moduleResolution has been set to bundler
			// while the moduleResolution is still not set
			// -> should prompt again
			true,
			// user wants to exit
			// -> should warn that type errors might occur and continue with init
			false,
		])

		await maybeChangeTsConfigModuleResolution()

		// info that the moduleResolution needs to be adapted
		expect(consola.warn).toHaveBeenCalledOnce()
		// 1. prompt the user to set the moduleResolution to bundler
		// 2. prompt again because the moduleResolution is still not set
		expect(consola.prompt).toHaveBeenCalledTimes(2)
		// the user has not set the moduleResolution to bundler
		// after the first prompt eventhough the user said it did
		expect(consola.error).toHaveBeenCalledOnce()
		// the user exists without setting the moduleResolution to bundler
		// warn about type errors
		expect(consola.warn).toHaveBeenCalledOnce()
	})
})

describe("maybeChangeTsConfigAllowJs()", () => {
	test("it should return if no tsconfig.json exists", async () => {
		mockFiles({})
		const result = await maybeChangeTsConfigAllowJs()
		// no tsconfig exists, immediately return
		expect(result).toBeUndefined()
		// the tsconfig should not have been read
		expect(fs.readFile).not.toHaveBeenCalled()
		// no info that the moduleResolution needs to be adapted should be logged
		expect(consola.info).not.toHaveBeenCalled()
	})

	test("it should return if the tsconfig already set allowJs to true", async () => {
		mockFiles({
			"/tsconfig.json": `{ 
				"compilerOptions": {
					"allowJs": true
				} 
			}`,
		})
		await maybeChangeTsConfigAllowJs()
		expect(consola.prompt).not.toHaveBeenCalled()
	})

	test("even if a base tsconfig sets the correct option, prompt the user to change the tsconfig to avoid unexpected behaviour down the road when the base config changes", async () => {
		mockFiles({
			"/tsconfig.base.json": `{
				"compilerOptions": {
					"allowJs": true
				}
			}`,
			"/tsconfig.json": `{ 
				"extends": "tsconfig.base.json", 
			}`,
		})
		mockUserInput([
			() => {
				fs.writeFile(
					"/tsconfig.json",
					`{
					"compilerOptions": {
						"allowJs": true
					}
				}`
				)
				return true
			},
		])
		await maybeChangeTsConfigAllowJs()
		// no info that the moduleResolution needs to be adapted should be logged
		expect(consola.prompt).toHaveBeenCalledOnce()
	})

	test("it should prompt the user to set allowJs to true", async () => {
		mockFiles({
			"/tsconfig.json": `{}`,
		})

		const userAdjustsTsConfigSpy = vi.fn()

		mockUserInput([
			// user confirms that the moduleResolution has been set to bundler
			() => {
				userAdjustsTsConfigSpy()
				fs.writeFile(
					"/tsconfig.json",
					`{
						"compilerOptions": {
							"allowJs": true
						}
					}`
				)
				return true
			},
		])

		await maybeChangeTsConfigAllowJs()

		// info that the moduleResolution needs to be adapted
		expect(consola.info).toHaveBeenCalledOnce()
		// prompt the user to set the moduleResolution to bundler
		expect(consola.prompt).toHaveBeenCalledOnce()
		// user has set the moduleResolution to bundler
		expect(userAdjustsTsConfigSpy).toHaveBeenCalledOnce()
	})

	test("it should keep prompting the user if allowJs has not been set to true", async () => {
		mockFiles({
			"/tsconfig.json": `{}`,
		})

		mockUserInput([
			// user confirms that the moduleResolution has been set to bundler
			// while the moduleResolution is still not set
			// -> should prompt again
			true,
			// user wants to exit
			// -> should warn that type errors might occur and continue with init
			false,
		])

		await maybeChangeTsConfigAllowJs()

		// info that the moduleResolution needs to be adapted
		expect(consola.warn).toHaveBeenCalledOnce()
		// 1. prompt the user to set the moduleResolution to bundler
		// 2. prompt again because the moduleResolution is still not set
		expect(consola.prompt).toHaveBeenCalledTimes(2)
		// the user has not set the moduleResolution to bundler
		// after the first prompt eventhough the user said it did
		expect(consola.error).toHaveBeenCalledOnce()
		// the user exists without setting the moduleResolution to bundler
		// warn about type errors
		expect(consola.warn).toHaveBeenCalledOnce()
	})
})

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

/**
 * Mock user input.
 *
 * @example
 * 	 mockUserInput([
 * 		"some input",
 * 		() => {
 *      fs.writeFileSync("some-file", "some content")
 *      return true
 *    }
 * 	 ]),
 */
const mockUserInput = (testUserInput: any[]) => {
	vi.spyOn(consola, "prompt").mockImplementation(() => {
		const value = testUserInput.shift()
		if (value === undefined) {
			throw new Error("End of test input")
		} else if (typeof value === "function") {
			return value()
		}
		return value
	})
}

const mockFiles = (files: memfs.NestedDirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON(files))
	vi.spyOn(fsSync, "existsSync").mockImplementation(_memfs.existsSync)
	for (const prop in fs) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof fs[prop] !== "function") continue
		// @ts-ignore - memfs has the same interface as node:fs/promises
		vi.spyOn(fs, prop).mockImplementation(_memfs.promises[prop])
	}
	return { existsSync: _memfs.existsSync }
}

test("a tsconfig with comments should be loaded correctly", () => {})
