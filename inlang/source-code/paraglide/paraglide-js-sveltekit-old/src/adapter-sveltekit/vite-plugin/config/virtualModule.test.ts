import { it, beforeEach, vi, expect } from "vitest"
import {
	PATH_TO_CWD,
	PATH_TO_INLANG_CONFIG,
	PATH_TO_SVELTE_CONFIG,
	initVirtualModule,
	resetTransformConfig,
} from "./virtualModule.js"
import {
	loadProject,
	type InlangProject,
	ProjectFilePathNotFoundError,
	createMessagesQuery,
} from "@inlang/sdk"
import { getNodeishFs } from "./utils/getNodeishFs.js"
import { InlangSdkException } from "../exceptions.js"
import { validateSdkConfig, type SdkConfig } from "../../../settings.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { createMessage } from "@inlang/sdk/test-utilities"

vi.mock("./utils/getNodeishFs.js")
vi.mock("@inlang/sdk", async () => ({
	...(await vi.importActual<typeof import("@inlang/sdk")>("@inlang/sdk")),
	loadProject: vi.fn(),
}))

beforeEach(() => {
	vi.resetAllMocks()
	resetTransformConfig()
})

it("should cache config creation", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(loadProject).mockImplementation(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"plugin.inlang.paraglideJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	const config1 = await initVirtualModule()
	expect(config1).toBeDefined()

	const config2 = await initVirtualModule()
	expect(config2).toBeDefined()
	expect(config2).toBe(config1)

	resetTransformConfig()
	const config3 = await initVirtualModule()
	expect(config3).not.toBe(config1)
})

it("should create demo resources if none are present yet", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const create = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(loadProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: { getAll: () => [], create } },
				customApi: () => ({
					"plugin.inlang.paraglideJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await initVirtualModule()

	expect(create).toHaveBeenCalledOnce()
})

it("should add the sdk plugin module if not present yet", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const setConfig = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(loadProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: [] }),
				setConfig,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({}),
			} as unknown as InlangProject),
	)
	vi.mocked(loadProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"plugin.inlang.paraglideJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await initVirtualModule()

	expect(setConfig).toHaveBeenCalledOnce()
	expect(setConfig).toHaveBeenNthCalledWith(1, {
		modules: ["../../../../../../plugins/paraglide/dist/index.js"],
		settings: {
			"library.inlang.paraglideJsSveltekit": {
				languageNegotiation: {
					strategies: [
						{
							type: "localStorage",
						},
					],
				},
			},
		},
	})
})

it("should throw if the SDK is not configured properly", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(loadProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({ "plugin.inlang.paraglideJs": {} as SdkConfig }),
			} as unknown as InlangProject),
	)

	await expect(async () => initVirtualModule()).rejects.toThrow(InlangSdkException)
})

it("should throw if no svelte.config.js file is found", async () => {
	const fs = createNodeishMemoryFs()

	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(loadProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"plugin.inlang.paraglideJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await expect(async () => initVirtualModule()).rejects.toThrow(InlangSdkException)
})

it("should correctly resolve the config", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")
	const create = vi.fn()
	const setConfig = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(loadProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
					modules: [`@inlang/plugin-paraglide`],
				}),
				setConfig,
				query: { messages: { getAll: () => [createMessage("hi", { en: "hello" })], create } },
				customApi: () => ({
					"plugin.inlang.paraglideJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)
	const config = await initVirtualModule()

	expect(setConfig).not.toHaveBeenCalled()
	expect(create).not.toHaveBeenCalled()

	expect(config).toMatchInlineSnapshot(`
		{
		  "cwdFolderPath": "${PATH_TO_CWD}",
		  "debug": false,
		  "languageTags": [
		    "en",
		    "de",
		  ],
		  "messages": [Function],
		  "options": {
		    "excludedRoutes": [],
		    "isStatic": false,
		    "languageInUrl": true,
		    "resourcesCache": "build-time",
		    "rootRoutesFolder": "${PATH_TO_CWD}/src/routes/[lang]",
		  },
		  "sourceLanguageTag": "en",
		  "svelteKit": {
		    "files": {
		      "appTemplate": "${PATH_TO_CWD}/src/app.html",
		      "routes": "${PATH_TO_CWD}/src/routes",
		      "serverHooks": "${PATH_TO_CWD}/src/hooks.server",
		    },
		    "usesTypeScript": false,
		    "version": "1.0.0",
		  },
		}
	`)
})
