import { expect, it } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import type { InlangEnvironment } from "@inlang/environment"
import type { InlangConfig } from "@inlang/config"
import { describe } from "node:test"
import {
	PluginImportError,
	PluginIncorrectlyDefinedUsedApisError,
	PluginInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginUsesUnavailableApiError,
} from "./errors.js"

const mockEnv = {} as InlangEnvironment
const mockConfig = {} as InlangConfig
const mockArgs = { env: mockEnv, config: mockConfig }

describe("generally", () => {
	it("should resolve a remote plugin", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})

	it("should resolve a local plugin", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})

	// namespace is required, only kebap-case allowed
	it("should return errors if plugins use invalid ids", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginInvalidIdError)
	})

	it("should return an error if a plugin cannot be imported", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginImportError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesUnavailableApiError)
	})

	it("should return an error if a plugin uses APIs that are not defined in meta.usedApis", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
	})

	it("should return an error if a plugin DOES NOT use APIs that are defined in meta.usedApis", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
	it("should collect an error if function is defined twice", async () => {})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
	it("should collect an error if function is defined twice", async () => {})
})

describe("addLintRules", () => {
	it("should resolve a single lint rule", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})

	it("should resolve multiple lint rules", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
})

describe("addAppSpecificApi", () => {
	it("it should resolve app specific configs", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})

	it("it should resolve app specific configs", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
})
