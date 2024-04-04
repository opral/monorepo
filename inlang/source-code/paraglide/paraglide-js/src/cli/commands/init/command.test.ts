import { test, expect, vi, beforeAll, beforeEach } from "vitest"
import {
	addCompileStepToPackageJSON,
	addParaglideJsToDevDependencies,
	maybeChangeTsConfigAllowJs,
	maybeChangeTsConfigModuleResolution,
	checkIfPackageJsonExists,
	checkIfUncommittedChanges,
	createNewProjectFlow,
	existingProjectFlow,
	findExistingInlangProjectPath,
	initializeInlangProject,
	maybeAddVsCodeExtension,
} from "./command.js"
import consola from "consola"
import { describe } from "node:test"
import nodeFsPromises from "node:fs/promises"
import childProcess from "node:child_process"
import memfs from "memfs"
import { loadProject, type ProjectSettings } from "@inlang/sdk"
import { version } from "../../state.js"
import { createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { Logger } from "../../../services/logger/index.js"
import { openRepository } from "@lix-js/client"
import type { NodeishFilesystem } from "@lix-js/fs"
import { pathExists } from "../../../services/file-handling/exists.js"
import { getNewProjectTemplate } from "./defaults.js"

const logger = new Logger()

beforeAll(() => {
	// spy on commonly used functions to prevent console output
	// and allow expecations
	vi.spyOn(Logger.prototype, "ln").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "info").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "success").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "warn").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "error").mockImplementation(() => Logger.prototype)
	vi.spyOn(process, "exit").mockImplementation((e) => {
		console.error(`PROCESS.EXIT()`, e)
		throw "PROCESS.EXIT()"
	})
})

beforeEach(() => {
	vi.resetAllMocks()
	// Re-mock consola before each test call to remove calls from before
	consola.mockTypes(() => vi.fn())

	// set the current working directory to some mock value to prevent
	// the tests from failing when running in a different environment
	process.cwd = () => "/"
	process.env.TERM_PROGRAM = "not-vscode"
})

// @eslint-ignore unicorn/no-null
type ChildProcessExecCallback = (error: Error | undefined, stdout: Buffer, stderr: Buffer) => void

describe("end to end tests", () => {
	test("it should exit if the user presses CTRL+C", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })
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
			await checkIfPackageJsonExists({ logger, repo })
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
			const fs = mockFiles({
				"/folder/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
				"/folder/subfolder": {},
			})
			const repo = await openRepository("file://", { nodeishFs: fs })

			process.cwd = () => "/folder/subfolder"
			mockUserInput(["useExistingProject"])
			const { projectPath: path } = await initializeInlangProject({ logger, repo })
			expect(path).toBe("../project.inlang")
		},
		{
			// i am on a plane with bad internet
			timeout: 20000,
		}
	)
	test("it should execute newProjectFlow() if no project has been found", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })
		mockUserInput(["newProject", "en"])
		const { project, projectPath: path } = await initializeInlangProject({ logger, repo })
		expect(path).toBe("./project.inlang")
		expect(project.settings().languageTags).toEqual(["en"])
		expect(await pathExists("./project.inlang", fs)).toBe(true)
	})
})

describe("addParaglideJsToDependencies()", () => {
	test("it should add paraglide-js to the dependencies with the latest version", async () => {
		const fs = mockFiles({
			"/package.json": "{}",
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await addParaglideJsToDevDependencies({ logger, repo })
		expect(fs.writeFile).toHaveBeenCalledOnce()
		expect(logger.success).toHaveBeenCalledOnce()
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.devDependencies["@inlang/paraglide-js"]).toBe(version)
	})
})

describe("addCompileStepToPackageJSON()", () => {
	test("if no scripts exist, it should add scripts.build", async () => {
		const fs = mockFiles({
			"/package.json": "{}",
		})
		const repo = await openRepository("file://", { nodeishFs: fs })
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		expect(fs.writeFile).toHaveBeenCalledOnce()
		expect(logger.success).toHaveBeenCalledOnce()
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.build).toBe(
			`paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`
		)
	})

	test("if an existing build step exists, it should be preceeded by the paraglide-js compile command", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					build: "some build step",
				},
			}),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		expect(fs.writeFile).toHaveBeenCalledOnce()
		expect(logger.success).toHaveBeenCalledOnce()
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.build).toBe(
			`paraglide-js compile --project ./project.inlang --outdir ./src/paraglide && some build step`
		)
	})

	test("if a paraglide-js compile step already exists, the user should be prompted to update it manually and exit if the user rejects", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					build: "paraglide-js compile --project ./project.inlang",
				},
			}),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user does not want to update the build step
			false,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		expect(fs.writeFile).not.toHaveBeenCalled()
		expect(logger.success).not.toHaveBeenCalled()
		expect(logger.warn).toHaveBeenCalledOnce()
		expect(process.exit).toHaveBeenCalled()
	})

	test("if a paraglide-js compile step already exists, the user should be prompted to update it manually and return if they did so", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					build: "paraglide-js compile --project ./project.inlang",
				},
			}),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user does not want to update the build step
			true,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		expect(fs.writeFile).not.toHaveBeenCalled()
		expect(logger.success).not.toHaveBeenCalled()
		expect(logger.warn).toHaveBeenCalledOnce()
		expect(process.exit).not.toHaveBeenCalled()
	})

	test("if there is a postinstall script present, add the paraglide-js compile command to it", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					postinstall: "do-something",
				},
			}),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user does not want to update the build step
			false,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		expect(fs.writeFile).toHaveBeenCalled()
		expect(logger.success).toHaveBeenCalled()

		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.postinstall).toBe(
			`paraglide-js compile --project ./project.inlang --outdir ./src/paraglide && do-something`
		)
	})

	test("if there is a postinstall script present, but it already has a paraglide command, leave it as is", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({
				scripts: {
					postinstall: "paraglide-js compile && do-something",
				},
			}),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user does not want to update the build step
			false,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.postinstall).toBe(`paraglide-js compile && do-something`)
	})

	test("if there is no postinstall script present add the paragldie compile command", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({}),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user does not want to update the build step
			false,
		])
		await addCompileStepToPackageJSON({
			projectPath: "./project.inlang",
			outdir: "./src/paraglide",
			logger,
			repo,
		})
		const packageJson = JSON.parse(
			(await fs.readFile("/package.json", { encoding: "utf-8" })) as string
		)
		expect(packageJson.scripts.postinstall).toBe(
			`paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`
		)
	})
})

describe("existingProjectFlow()", () => {
	test("if the user selects to proceed with the existing project and the project has no errors, the function should return the project", async () => {
		const fs = mockFiles({
			"/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput(["useExistingProject"])
		const project = await existingProjectFlow(
			{ existingProjectPath: "/project.inlang" },
			{ logger, repo }
		)

		expect(project.settings().languageTags).toEqual(getNewProjectTemplate().languageTags)
	})

	test("if the user selects a new project, the newProjectFlow() should be executed", async () => {
		const fs = mockFiles({
			"/folder/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput(["newProject", "en"])

		await existingProjectFlow({ existingProjectPath: "/folder/project.inlang" }, { logger, repo })
		// info that a new project is created
		expect(logger.info).toHaveBeenCalledOnce()
		// the newly created project file should exist
		expect(await pathExists("/project.inlang", fs)).toBe(true)
	})

	test("it should exit if the existing project contains errors", async () => {
		const fs = mockFiles({
			"/project.inlang/settings.json": `BROKEN PROJECT FILE`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput(["useExistingProject"])
		await existingProjectFlow({ existingProjectPath: "/project.inlang" }, { logger, repo })
		expect(logger.error).toHaveBeenCalled()
		expect(process.exit).toHaveBeenCalled()
	})
})

describe("maybeAddVsCodeExtension()", () => {
	test("it should add the Visual Studio Code extension (Sherlock) if the user uses vscode", async () => {
		const fs = mockFiles({
			"/folder/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
		})

		process.cwd = () => "/folder"

		const repo = await openRepository("file://folder/", { nodeishFs: fs })
		const project = await loadProject({
			projectPath: "/folder/project.inlang",
			repo,
		})
		mockUserInput([
			// user uses vscode
			true,
		])
		await maybeAddVsCodeExtension({ project, logger, repo })
		expect(consola.prompt).toHaveBeenCalledOnce()
		const extensions = await fs.readFile("/folder/.vscode/extensions.json", {
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
	test("it should not add the Visual Studio Code extension (Sherlock) if the user doesn't use vscode", async () => {
		const fs = mockFiles({
			"/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })
		const project = await loadProject({
			projectPath: "/project.inlang",
			repo,
		})

		mockUserInput([
			// user does not use vscode
			false,
		])
		await maybeAddVsCodeExtension({ project, logger, repo })
		expect(consola.prompt).toHaveBeenCalledOnce()
		expect(fs.writeFile).not.toHaveBeenCalled()
	})

	test("it should install the m function matcher if not installed", async () => {
		const withEmptyModules = getNewProjectTemplate()
		//@ts-ignore
		withEmptyModules.modules = []
		const fs = mockFiles({
			"/project.inlang/settings.json": JSON.stringify(withEmptyModules),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })
		const project = await loadProject({
			projectPath: "/project.inlang",
			repo,
		})

		mockUserInput([
			// user uses vscode
			true,
		])
		await maybeAddVsCodeExtension({ project, logger, repo })
		const projectSettings = JSON.parse(
			await fs.readFile("/project.inlang/settings.json", {
				encoding: "utf-8",
			})
		) as ProjectSettings
		expect(projectSettings.modules.some((m) => m.includes("m-function-matcher"))).toBe(true)
	})
	test("it should create the .vscode folder if not existent", async () => {
		const fs = mockFiles({
			"/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })
		const project = await loadProject({
			projectPath: "/project.inlang",
			repo,
		})

		mockUserInput([
			// user uses vscode
			true,
		])
		await maybeAddVsCodeExtension({ project, logger, repo })
		expect(await pathExists("/.vscode/extensions.json", fs)).toBe(true)
	})

	test("it should skip asking about vscode if the command is being run inside the vscode terminal", async () => {
		process.env.TERM_PROGRAM = "vscode"
		const fs = mockFiles({
			"/project.inlang/settings.json": JSON.stringify(getNewProjectTemplate()),
		})
		const repo = await openRepository("file://", { nodeishFs: fs })
		const project = await loadProject({
			projectPath: "/project.inlang",
			repo,
		})

		await maybeAddVsCodeExtension({ project, logger, repo })
		expect(consola.prompt).not.toHaveBeenCalled()
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
})

describe("createNewProjectFlow()", async () => {
	test(
		"it should succeed in creating a new project",
		async () => {
			const fs = mockFiles({})
			const repo = await openRepository("file://", { nodeishFs: fs })

			mockUserInput(["en"])
			await createNewProjectFlow({ logger, repo })

			// user is informed that a new project is created
			expect(logger.info).toHaveBeenCalledOnce()
			// the project shouldn't have errors
			expect(logger.error).not.toHaveBeenCalled()
			// user is informed that the project has successfully been created
			expect(logger.success).toHaveBeenCalledOnce()
			// the project file should exist
			expect(await pathExists("/project.inlang", fs)).toBe(true)
		},
		{
			// i am testing this while i am on an airplane with slow internet
			timeout: 20000,
		}
	)
	test("it should exit if the project has errors", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		// invalid project settings file
		vi.spyOn(JSON, "stringify").mockReturnValue(`{}`)

		mockUserInput(["en"])
		await createNewProjectFlow({ logger, repo })
		// user is informed that a new project is created
		expect(logger.info).toHaveBeenCalledOnce()
		// the project has errors
		expect(logger.error).toHaveBeenCalled()
		// the commands exits
		expect(process.exit).toHaveBeenCalled()
	})

	test("it should create the messages folder and a message file for each language", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		// purpousefully formatted the input weird
		mockUserInput(["  	,en, 	 ,de-ch  "])
		await createNewProjectFlow({ logger, repo })

		// user is informed that a new project is created
		expect((await fs.stat("/messages")).isDirectory()).toBe(true)

		for (const language of ["en", "de-ch"]) {
			expect(await pathExists(`/messages/${language}.json`, fs)).toBe(true)
		}
	})

	test("it keeps prompting until valid language tags are entered", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		// purpousefully formatted the input weird
		mockUserInput(["2173, de, en", "en,de,9DE", "en,de-ch"])
		await createNewProjectFlow({ logger, repo })

		// user is informed that a new project is created
		expect((await fs.stat("/messages")).isDirectory()).toBe(true)

		for (const language of ["en", "de-ch"]) {
			expect(await pathExists(`/messages/${language}.json`, fs)).toBe(true)
		}
	})
})

describe("checkIfUncommittedChanges()", () => {
	test("it should not fail if the git cli is not installed", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		vi.spyOn(childProcess, "exec").mockImplementation((command, callback): any => {
			const cb = callback as ChildProcessExecCallback
			cb(new Error("Command failed: git status"), Buffer.from(""), Buffer.from(""))
		})

		expect(checkIfUncommittedChanges({ logger, repo })).resolves.toBeDefined()
	})

	test("it should continue if no uncomitted changes exist", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		vi.spyOn(childProcess, "exec").mockImplementation((command, callback): any => {
			const cb = callback as ChildProcessExecCallback
			cb(undefined, Buffer.from(""), Buffer.from(""))
		})

		expect(checkIfUncommittedChanges({ logger, repo })).resolves.toBeDefined()
	})

	test("it should prompt the user if there are uncommitted changes and exit if the user doesn't want to continue", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		vi.spyOn(childProcess, "exec").mockImplementation((command, callback): any => {
			const cb = callback as ChildProcessExecCallback
			cb(undefined, Buffer.from("M package.json"), Buffer.from(""))
		})

		const processExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
		mockUserInput([
			// user does not want to continue
			false,
		])

		await checkIfUncommittedChanges({ logger, repo })
		expect(logger.info).toHaveBeenCalledOnce()
		expect(consola.prompt).toHaveBeenCalledOnce()
		expect(processExit).toHaveBeenCalledOnce()
	})

	test("it should prompt the user if there are uncommitted changes and return if the user wants to continue", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		vi.spyOn(childProcess, "exec").mockImplementation((command, callback): any => {
			const cb = callback as ChildProcessExecCallback
			cb(undefined, Buffer.from("M package.json"), Buffer.from(""))
		})

		const processExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
		mockUserInput([
			// user does want to continue
			true,
		])

		await checkIfUncommittedChanges({ logger, repo })

		expect(logger.info).toHaveBeenCalledOnce()
		expect(consola.prompt).toHaveBeenCalledOnce()
		expect(processExit).not.toHaveBeenCalledOnce()
	})
	test("it should not prompt the user if no uncommitted changes exist", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		vi.spyOn(childProcess, "exec").mockImplementation((command, callback): any => {
			const cb = callback as ChildProcessExecCallback
			cb(undefined, Buffer.from(""), Buffer.from(""))
		})

		await checkIfUncommittedChanges({ logger, repo })
		expect(consola.prompt).not.toHaveBeenCalled()
	})
})

describe("checkIfPackageJsonExists()", () => {
	test("it should exit if no package.json has been found", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await checkIfPackageJsonExists({ logger, repo })
		expect(logger.warn).toHaveBeenCalledOnce()
		expect(process.exit).toHaveBeenCalledOnce()
	})

	test("it should not exit if a package.json exists in the current working directory", async () => {
		const fs = mockFiles({ "package.json": "" })
		const repo = await openRepository("file://", { nodeishFs: fs })

		await checkIfPackageJsonExists({ logger, repo })
		expect(logger.warn).not.toHaveBeenCalled()
		expect(process.exit).not.toHaveBeenCalled()
	})
})

describe("findExistingInlangProjectPath()", () => {
	test("it should return undefined if no project.inlang has been found", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		const path = await findExistingInlangProjectPath(repo)
		expect(path).toBeUndefined()
	})

	test("it find a project in the current working directory", async () => {
		process.cwd = () => "/"
		const fs = mockFiles({ "project.inlang/settings.json": "{}" })
		const repo = await openRepository("file://", { nodeishFs: fs })

		const path = await findExistingInlangProjectPath(repo)
		expect(path).toBe("./project.inlang")
	})

	test("it should find a project in a parent directory", async () => {
		process.cwd = () => "/nested/"

		const fs = mockFiles({
			"/project.inlang/settings.json": "{}",
			"/nested/": {},
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		const path = await findExistingInlangProjectPath(repo)
		expect(path).toBe("../project.inlang")
	})

	test("it should find a project in a parent parent directory", async () => {
		process.cwd = () => "/nested/nested/"
		const fs = mockFiles({
			"/project.inlang/settings.json": "{}",
			"/nested/nested/": {},
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		const path = await findExistingInlangProjectPath(repo)
		expect(path).toBe("../../project.inlang")
	})
})

describe("maybeChangeTsConfigModuleResolution()", () => {
	test("it should return if no tsconfig.json exists", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await maybeChangeTsConfigModuleResolution({ logger, repo })
		// no info that the moduleResolution needs to be adapted should be logged
		expect(logger.info).not.toHaveBeenCalled()
	})

	test("it should warn if the extended from tsconfig can't be read", async () => {
		const fs = mockFiles({
			"/tsconfig.json": `{
				"extends": "./non-existend.json",
				"compilerOptions": {
					"moduleResolution": "Bundler"
				}
			}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await maybeChangeTsConfigModuleResolution({ logger, repo })
		// no info that the moduleResolution needs to be adapted should be logged

		expect(logger.warn).toHaveBeenCalledOnce()
	})

	test("it should detect if the extended from tsconfig already set the moduleResolution to bundler to ease the getting started process", async () => {
		const fs = mockFiles({
			"/tsconfig.base.json": `{
				"compilerOptions": {
					"moduleResolution": "Bundler"
				}
			}`,
			"/tsconfig.json": `{
				"extends": "tsconfig.base.json",
			}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await maybeChangeTsConfigModuleResolution({ logger, repo })
		// no info that the moduleResolution needs to be adapted should be logged
		expect(logger.info).not.toHaveBeenCalled()
	})

	test("it should prompt the user to set the moduleResolution to bundler", async () => {
		const fs = mockFiles({
			"/tsconfig.json": `{}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

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

		await maybeChangeTsConfigModuleResolution({ logger, repo })

		// info that the moduleResolution needs to be adapted
		expect(logger.info).toHaveBeenCalledOnce()
		// prompt the user to set the moduleResolution to bundler
		expect(consola.prompt).toHaveBeenCalledOnce()
		// user has set the moduleResolution to bundler
		expect(userAdjustsTsConfigSpy).toHaveBeenCalledOnce()
	})

	test("it should keep prompting the user to set the moduleResolution to bundler if the moduleResolution has not been set", async () => {
		const fs = mockFiles({
			"/tsconfig.json": `{}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user confirms that the moduleResolution has been set to bundler
			// while the moduleResolution is still not set
			// -> should prompt again
			true,
			// user wants to exit
			// -> should warn that type errors might occur and continue with init
			false,
		])

		await maybeChangeTsConfigModuleResolution({ logger, repo })

		// info that the moduleResolution needs to be adapted
		expect(logger.warn).toHaveBeenCalledOnce()
		// 1. prompt the user to set the moduleResolution to bundler
		// 2. prompt again because the moduleResolution is still not set
		expect(consola.prompt).toHaveBeenCalledTimes(2)
		// the user has not set the moduleResolution to bundler
		// after the first prompt eventhough the user said it did
		expect(logger.error).toHaveBeenCalledOnce()
		// the user exists without setting the moduleResolution to bundler
		// warn about type errors
		expect(logger.warn).toHaveBeenCalledOnce()
	})
})

describe("maybeChangeTsConfigAllowJs()", () => {
	test("it should return if no tsconfig.json exists", async () => {
		const fs = mockFiles({})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await maybeChangeTsConfigAllowJs({ logger, repo })
		// no info that the moduleResolution needs to be adapted should be logged
		expect(logger.info).not.toHaveBeenCalled()
	})

	test("it should return if the tsconfig already set allowJs to true", async () => {
		const fs = mockFiles({
			"/tsconfig.json": `{
				"compilerOptions": {
					"allowJs": true
				}
			}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		await maybeChangeTsConfigAllowJs({ logger, repo })
		expect(consola.prompt).not.toHaveBeenCalled()
	})

	test("even if a base tsconfig sets the correct option, prompt the user to change the tsconfig to avoid unexpected behaviour down the road when the base config changes", async () => {
		const fs = mockFiles({
			"/tsconfig.base.json": `{
				"compilerOptions": {
					"allowJs": true
				}
			}`,
			"/tsconfig.json": `{
				"extends": "tsconfig.base.json",
			}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

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
		await maybeChangeTsConfigAllowJs({ logger, repo })
		// no info that the moduleResolution needs to be adapted should be logged
		expect(consola.prompt).toHaveBeenCalledOnce()
	})

	test("it should prompt the user to set allowJs to true", async () => {
		const fs = mockFiles({
			"/tsconfig.json": `{}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

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

		await maybeChangeTsConfigAllowJs({ logger, repo })

		// info that the moduleResolution needs to be adapted
		expect(logger.info).toHaveBeenCalledOnce()
		// prompt the user to set the moduleResolution to bundler
		expect(consola.prompt).toHaveBeenCalledOnce()
		// user has set the moduleResolution to bundler
		expect(userAdjustsTsConfigSpy).toHaveBeenCalledOnce()
	})

	test("it should keep prompting the user if allowJs has not been set to true", async () => {
		const fs = mockFiles({
			"/tsconfig.json": `{}`,
		})
		const repo = await openRepository("file://", { nodeishFs: fs })

		mockUserInput([
			// user confirms that the moduleResolution has been set to bundler
			// while the moduleResolution is still not set
			// -> should prompt again
			true,
			// user wants to exit
			// -> should warn that type errors might occur and continue with init
			false,
		])

		await maybeChangeTsConfigAllowJs({ logger, repo })

		// info that the moduleResolution needs to be adapted
		expect(logger.warn).toHaveBeenCalledOnce()
		// 1. prompt the user to set the moduleResolution to bundler
		// 2. prompt again because the moduleResolution is still not set
		expect(consola.prompt).toHaveBeenCalledTimes(2)
		// the user has not set the moduleResolution to bundler
		// after the first prompt eventhough the user said it did
		expect(logger.error).toHaveBeenCalledOnce()
		// the user exists without setting the moduleResolution to bundler
		// warn about type errors
		expect(logger.warn).toHaveBeenCalledOnce()
	})
})

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
	const lixFs = createNodeishMemoryFs()
	for (const prop in nodeFsPromises) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof nodeFsPromises[prop] !== "function") continue

		// @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
		if (nodeFsPromises[prop].name === "watch") {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(_memfs.promises, prop).mockImplementation(lixFs[prop])
		} else {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(_memfs.promises, prop)
		}
	}
	return _memfs.promises as NodeishFilesystem
}

test("a tsconfig with comments should be loaded correctly", () => {})
