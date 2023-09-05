import { it, beforeEach, vi, expect } from "vitest"
import {
	PATH_TO_CWD,
	PATH_TO_INLANG_CONFIG,
	PATH_TO_SVELTE_CONFIG,
	initTransformConfig,
	resetTransformConfig,
} from "./config.js"
import {
	openInlangProject,
	type InlangProject,
	ProjectFilePathNotFoundError,
	createMessagesQuery,
} from "@inlang/sdk"
import * as createBasicInlangConfigModule from "./utils/createBasicInlangConfig.js"
import { getNodeishFs } from "./utils/getNodeishFs.js"
import { version } from "../../../../package.json"
import { InlangSdkException } from "../exceptions.js"
import { validateSdkConfig, type SdkConfig } from "../../../../../plugins/paraglide/dist/index.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { createMessage } from "@inlang/sdk/test-utilities"

vi.mock("./utils/getNodeishFs.js")
vi.mock("@inlang/sdk", async () => ({
	...(await vi.importActual<typeof import("@inlang/sdk")>("@inlang/sdk")),
	openInlangProject: vi.fn(),
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
	vi.mocked(openInlangProject).mockImplementation(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	const config1 = await initTransformConfig()
	expect(config1).toBeDefined()

	const config2 = await initTransformConfig()
	expect(config2).toBeDefined()
	expect(config2).toBe(config1)

	resetTransformConfig()
	const config3 = await initTransformConfig()
	expect(config3).not.toBe(config1)
})

it("should create an inlang config file if no config is present yet", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [new ProjectFilePathNotFoundError("", {})],
			} as unknown as InlangProject),
	)

	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	const spy = vi.spyOn(createBasicInlangConfigModule, "createBasicInlangConfig")

	await expect(() => fs.readFile(PATH_TO_INLANG_CONFIG, { encoding: "utf-8" })).rejects.toThrow()

	await initTransformConfig()

	expect(spy).toHaveBeenCalledOnce()
	expect(await fs.readFile(PATH_TO_INLANG_CONFIG, { encoding: "utf-8" })).toBeDefined()
})

it("should update the sdk module version", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const setConfig = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await initTransformConfig()

	expect(setConfig).toHaveBeenCalledOnce()
	expect(setConfig).toHaveBeenNthCalledWith(1, {
		modules: [`https://cdn.jsdelivr.net/npm/@inlang/plugin-paraglide@${version}/dist/index.js`],
	})
})

it("should not update the sdk module version if already up2date", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const setConfig = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: [`@inlang/plugin-paraglide@${version}`] }),
				setConfig,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await initTransformConfig()

	expect(setConfig).not.toHaveBeenCalled()
})

it("should create demo resources if none are present yet", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const create = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: { getAll: () => [], create } },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await initTransformConfig()

	expect(create).toHaveBeenCalledOnce()
})

it("should add the sdk plugin module if not present yet", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const setConfig = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: [] }),
				setConfig,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({}),
			} as unknown as InlangProject),
	)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await initTransformConfig()

	expect(setConfig).toHaveBeenCalledOnce()
	expect(setConfig).toHaveBeenNthCalledWith(1, {
		modules: ["../../../../../paraglide-plugin/dist/index.js"],
		settings: {
			"library.inlang.paraglideJs": {
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
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({ "inlang.app.sdkJs": {} as SdkConfig }),
			} as unknown as InlangProject),
	)

	await expect(async () => initTransformConfig()).rejects.toThrow(InlangSdkException)
})

it("should throw if no svelte.config.js file is found", async () => {
	const fs = await createNodeishMemoryFs()

	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({ modules: ["@inlang/plugin-paraglide"] }),
				setConfig: () => undefined,
				query: { messages: createMessagesQuery(() => [createMessage("hi", { en: "hello" })]) },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)

	await expect(async () => initTransformConfig()).rejects.toThrow(InlangSdkException)
})

it("should correctly resolve the config", async () => {
	const fs = createNodeishMemoryFs()
	await fs.mkdir(PATH_TO_CWD, { recursive: true })
	await fs.writeFile(PATH_TO_SVELTE_CONFIG, "export default {}")

	const create = vi.fn()
	const setConfig = vi.fn()
	vi.mocked(getNodeishFs).mockImplementation(async () => fs)
	vi.mocked(openInlangProject).mockImplementationOnce(
		async () =>
			({
				errors: () => [],
				config: () => ({
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
					modules: [`@inlang/plugin-paraglide@${version}`],
				}),
				setConfig,
				query: { messages: { getAll: () => [createMessage("hi", { en: "hello" })], create } },
				customApi: () => ({
					"inlang.app.sdkJs": validateSdkConfig({
						languageNegotiation: { strategies: [{ type: "url" }] },
					}),
				}),
			} as unknown as InlangProject),
	)
	const spy = vi.spyOn(createBasicInlangConfigModule, "createBasicInlangConfig")

	const config = await initTransformConfig()

	expect(spy).not.toHaveBeenCalled()
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
