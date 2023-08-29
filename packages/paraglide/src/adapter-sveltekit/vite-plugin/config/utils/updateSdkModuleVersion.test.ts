import { describe, it, expect, vi, beforeEach } from "vitest"
import {
	standaloneUpdateSdkModuleVersion,
	updateSdkModuleVersion,
} from "./updateSdkModuleVersion.js"
import { createMockNodeishFs } from "@inlang/app/test"
import {
	InlangConfig,
	openInlangProject,
	type Plugin,
	type InlangProject,
	type NodeishFilesystemSubset,
} from "@inlang/app"
import type { InlangModule } from "@inlang/module"
// @ts-ignore
import { version } from "../../../../../package.json"
import { PATH_TO_CWD, PATH_TO_INLANG_CONFIG } from "../config.js"

vi.mock("@inlang/app", async () => ({
	...(await vi.importActual<typeof import("@inlang/app")>("@inlang/app")),
	openInlangProject: vi.fn(),
}))

const getMockedConfig = (...modules: string[]): InlangConfig => ({
	sourceLanguageTag: "en",
	languageTags: ["en"],
	settings: { "inlang.plugin.json": { pathPattern: "{languageTag}.json" } },
	modules: ["plugin-json-mock", ...modules],
})

const openMockedInlangProject = async (fs: NodeishFilesystemSubset): Promise<InlangProject> => {
	const mockPlugin: Plugin = {
		meta: {
			id: "mock.plugin.name",
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
		configPath: "./project.inlang.json",
		_import: async (url) =>
			({
				default: url === "plugin-json-mock" ? { plugins: [mockPlugin] } : {},
			} satisfies InlangModule),
	})
}

describe("updateSdkModuleVersion", () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.mocked(openInlangProject).mockImplementation(
			async (...args: Parameters<typeof openInlangProject>) => {
				const { openInlangProject } = await vi.importActual<typeof import("@inlang/app")>(
					"@inlang/app",
				)

				return openInlangProject(...args)
			},
		)
	})

	it("should not do anything if module is not defined", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(getMockedConfig()))
		const inlang = await openMockedInlangProject(fs)

		const updated = await updateSdkModuleVersion(inlang)
		expect(updated).toBe(false)
	})

	it("should not do anything if version is already identical", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile(
			"./project.inlang.json",
			JSON.stringify(getMockedConfig(`https://cdn.com/@inlang/sdk-js-plugin@${version}/index.js`)),
		)
		const inlang = await openMockedInlangProject(fs)

		const updated = await updateSdkModuleVersion(inlang)
		expect(updated).toBe(false)
	})

	describe("should update the version in the config file if it is not identical", () => {
		it("no version set", async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/sdk-js-plugin/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})

		it("@x.x.x", async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/sdk-js-plugin@0.0.0/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})

		it("@x.x", async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/sdk-js-plugin@0.0/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})

		it("@x", async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify(getMockedConfig("https://cdn.com/@inlang/sdk-js-plugin@0/index.js")),
			)
			const inlang = await openMockedInlangProject(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})
	})
})

describe("standaloneUpdateSdkModuleVersion", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should throw if inlang could not be setup correctly", async () => {
		expect(() => standaloneUpdateSdkModuleVersion()).rejects.toThrow()
	})

	it("should not do anything if version is already identical", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir(PATH_TO_INLANG_CONFIG, { recursive: true })
		const config = getMockedConfig(`https://cdn.com/@inlang/sdk-js-plugin@${version}/index.js`)
		await fs.writeFile(PATH_TO_INLANG_CONFIG, JSON.stringify(config))

		vi.mocked(openInlangProject).mockImplementationOnce(
			async () => ({ config: () => config } as InlangProject),
		)

		const updated = await standaloneUpdateSdkModuleVersion()
		expect(updated).toBe(false)
	})

	it("should update the version in the config file if it is not identical", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir(PATH_TO_CWD, { recursive: true })
		const config = getMockedConfig(`https://cdn.com/@inlang/sdk-js-plugin@0/index.js`)
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

		const updated = await standaloneUpdateSdkModuleVersion()
		expect(updated).toBe(true)

		const configFile = await fs.readFile(PATH_TO_INLANG_CONFIG, { encoding: "utf-8" })
		expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
	})
})
