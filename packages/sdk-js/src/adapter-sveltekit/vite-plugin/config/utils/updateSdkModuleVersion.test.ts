import { vi, describe, it, expect } from 'vitest'
import { standaloneUpdateSdkModuleVersion, updateSdkModuleVersion } from './updateSdkModuleVersion.js'
import { createMockNodeishFs } from "@inlang/plugin/test"
import { InlangConfig, createInlang, type Plugin, type InlangInstance, type NodeishFilesystemSubset } from '@inlang/app'
import type { InlangModule } from '@inlang/module'
// @ts-ignore
import { version } from '../../../../../package.json';
import { PATH_TO_CWD, PATH_TO_INLANG_CONFIG } from '../config.js'

const getConfig = (...modules: string[]): InlangConfig => ({
	sourceLanguageTag: 'en',
	languageTags: ['en'],
	settings: { "inlang.plugin.json": { pathPattern: '{languageTag}.json' } },
	modules: ['plugin-json-mock', ...modules],
})

// TODO: create utility function
const createMockInlang = async (fs: NodeishFilesystemSubset): Promise<InlangInstance> => {
	const mockPlugin: Plugin = {
		meta: {
			id: "mock.plugin.name",
			displayName: {
				en: "hello",
			},
			description: {
				en: "wo",
			},
			keywords: [],
		},
		loadMessages: () => ([]),
		saveMessages: () => undefined,
	}

	return await createInlang({
		nodeishFs: fs,
		configPath: "./inlang.config.json",
		_import: async (url) =>
		({
			default: url === 'plugin-json-mock' ? { plugins: [mockPlugin] } : {},
		} satisfies InlangModule),
	})
}

describe('updateSdkModuleVersion', () => {
	it('should not do anything if module is not defined', async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(getConfig()))
		const inlang = await createMockInlang(fs)

		const updated = await updateSdkModuleVersion(inlang)
		expect(updated).toBe(false)
	})

	it('should not do anything if version is already identical', async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(getConfig(`https://cdn.com/@inlang/sdk-js-plugin@${version}/index.js`)))
		const inlang = await createMockInlang(fs)

		const updated = await updateSdkModuleVersion(inlang)
		expect(updated).toBe(false)
	})

	describe('should update the version in the config file if it is not identical', () => {
		it('no version set', async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile("./inlang.config.json", JSON.stringify(getConfig('https://cdn.com/@inlang/sdk-js-plugin/index.js')))
			const inlang = await createMockInlang(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./inlang.config.json", { encoding: 'utf-8' })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})

		it('@x.x.x', async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile("./inlang.config.json", JSON.stringify(getConfig('https://cdn.com/@inlang/sdk-js-plugin@0.0.0/index.js')))
			const inlang = await createMockInlang(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./inlang.config.json", { encoding: 'utf-8' })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})

		it('@x.x', async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile("./inlang.config.json", JSON.stringify(getConfig('https://cdn.com/@inlang/sdk-js-plugin@0.0/index.js')))
			const inlang = await createMockInlang(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./inlang.config.json", { encoding: 'utf-8' })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})

		it('@x', async () => {
			const fs = await createMockNodeishFs()
			await fs.writeFile("./inlang.config.json", JSON.stringify(getConfig('https://cdn.com/@inlang/sdk-js-plugin@0/index.js')))
			const inlang = await createMockInlang(fs)

			const updated = await updateSdkModuleVersion(inlang)
			expect(updated).toBe(true)

			const configFile = await fs.readFile("./inlang.config.json", { encoding: 'utf-8' })
			expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
		})
	})
})

// TODO: check how we can mock `@inlang/app`
describe.skip('standaloneUpdateSdkModuleVersion', () => {
	it('should throw if inlang could not be setup correctly', async () => {
		expect(() => standaloneUpdateSdkModuleVersion()).rejects.toThrow()
	})

	it('should not do anything if version is already identical', async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile(PATH_TO_INLANG_CONFIG, JSON.stringify(getConfig(`https://cdn.com/@inlang/sdk-js-plugin@${version}/index.js`)))

		const updated = await standaloneUpdateSdkModuleVersion()
		expect(updated).toBe(false)
	})

	it('should update the version in the config file if it is not identical', async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir(PATH_TO_CWD, { recursive: true })

		await fs.writeFile(PATH_TO_INLANG_CONFIG, JSON.stringify(getConfig('https://cdn.com/@inlang/sdk-js-plugin@0/index.js')))

		const updated = await standaloneUpdateSdkModuleVersion()
		expect(updated).toBe(true)

		const configFile = await fs.readFile(PATH_TO_INLANG_CONFIG, { encoding: 'utf-8' })
		expect(configFile).includes(`@inlang/sdk-js-plugin@${version}`)
	})
})
