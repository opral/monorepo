import { describe, it, expect, vi, beforeEach } from "vitest"
import {
	standaloneUpdateParaglideModuleVersion,
	updateParaglideModuleVersion,
} from "./updateParaglideModuleVersion.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import {
	ProjectConfig,
	openInlangProject,
	type Plugin,
	type InlangProject,
	type NodeishFilesystemSubset,
} from "@inlang/sdk"
import type { InlangModule } from "@inlang/module"
// @ts-ignore
import { version } from "../../../../../package.json"
import { PATH_TO_CWD, PATH_TO_INLANG_CONFIG } from "../config.js"

vi.mock("@inlang/sdk", async () => ({
	...(await vi.importActual<typeof import("@inlang/sdk")>("@inlang/sdk")),
	openInlangProject: vi.fn(),
}))

const getMockedConfig = (...modules: string[]): ProjectConfig => ({
	sourceLanguageTag: "en",
	languageTags: ["en"],
	settings: { "plugin.inlang.json": { pathPattern: "{languageTag}.json" } },
	modules: ["https://cdn.com/@inlang/plugin-json@3/index.js", ...modules],
})

const openMockedInlangProject = async (fs: NodeishFilesystemSubset): Promise<InlangProject> => {
	const mockPlugin: Plugin = {
		meta: {
			id: "plugin.mock.name",
			displayName: {
				en: "hello",
			},
			description: {
				en: "wo",
			},
		},
		loadMessages: () => [],
		saveMessages: () => undefined,
	}

	return await openInlangProject({
		nodeishFs: fs,
		projectFilePath: "./project.inlang.json",
		_import: async (url) =>
			({
				default:
					url === "https://cdn.com/@inlang/plugin-json@3/index.js" ? mockPlugin : ({} as Plugin),
			} satisfies InlangModule),
	})
}

describe("updateParaglideModuleVersion", () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.mocked(openInlangProject).mockImplementation(
			async (...args: Parameters<typeof openInlangProject>) => {
				const { openInlangProject } = await vi.importActual<typeof import("@inlang/sdk")>(
					"@inlang/sdk",
				)

				return openInlangProject(...args)
			},
		)
	})

	it("should not do anything if module is not defined", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(getMockedConfig()))
		const inlang = await openMockedInlangProject(fs)

		const updated = await updateParaglideModuleVersion(inlang)
		expect(updated).toBe(false)
	})

	it("should not do anything if version is already identical", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile(
			"./project.inlang.json",
			JSON.stringify(getMockedConfig(`https://cdn.com/@inlang/plugin-paraglide@0/index.js`)),
		)

		const inlang = await openMockedInlangProject(fs)

		const updated = await updateParaglideModuleVersion(inlang)
		expect(updated).toBe(false)
	})

	describe("should update the version in the config file if it is not identical", () => {
		it("no version set", async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/plugin-paraglide/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			// @ts-ignore
			console.log("errors", inlang.errors()[0].cause)

			const updated = await updateParaglideModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/plugin-paraglide@${version}`)
		})

		it("@x.x.x", async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/plugin-paraglide@0.0.0/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateParaglideModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/plugin-paraglide@${version}`)
		})

		it("@x.x", async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/plugin-paraglide@0.0/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateParaglideModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/plugin-paraglide@${version}`)
		})

		it("@x", async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/plugin-paraglide@0/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateParaglideModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/plugin-paraglide@${version}`)
		})
	})
})

describe("standaloneUpdateParaglideModuleVersion", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should throw if inlang could not be setup correctly", async () => {
		expect(() => standaloneUpdateParaglideModuleVersion()).rejects.toThrow()
	})

	it("should not do anything if version is already identical", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir(PATH_TO_INLANG_CONFIG, { recursive: true })
		const config = getMockedConfig(`https://cdn.com/@inlang/plugin-paraglide@0/index.js`)
		await fs.writeFile(PATH_TO_INLANG_CONFIG, JSON.stringify(config))

		vi.mocked(openInlangProject).mockImplementationOnce(
			async () => ({ config: () => config } as InlangProject),
		)

		const updated = await standaloneUpdateParaglideModuleVersion()
		expect(updated).toBe(false)
	})

	it("should update the version in the config file if it is not identical", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir(PATH_TO_CWD, { recursive: true })
		const config = getMockedConfig(`https://cdn.com/@inlang/plugin-paraglide@0/index.js`)
		await fs.writeFile(PATH_TO_INLANG_CONFIG, JSON.stringify(config))

		vi.mocked(openInlangProject).mockImplementationOnce(
			async () =>
				({
					config: () => config,
					setConfig(config) {
						fs.writeFile(PATH_TO_INLANG_CONFIG, JSON.stringify(config))
					},
				} as InlangProject),
		)

		const updated = await standaloneUpdateParaglideModuleVersion()
		expect(updated).toBe(true)

		const configFile = await fs.readFile(PATH_TO_INLANG_CONFIG, { encoding: "utf-8" })
		expect(configFile).includes(`@inlang/plugin-paraglide@${version}`)
	})
})
