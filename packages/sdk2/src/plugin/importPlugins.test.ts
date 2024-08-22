import { test, expect, vi } from "vitest";
import { importPlugins } from "./importPlugins.js";
import type { InlangPlugin } from "./schema.js";
import { PluginImportError } from "./errors.js";

test("it should return the provided mock plugin if provided", async () => {
	global.fetch = vi.fn();

	const result = await importPlugins({
		settings: {
			baseLocale: "en",
			locales: ["en"],
			modules: ["mock.js", "mock2.js"],
		},
		mockPlugins: {
			"mock.js": { key: "mock" } satisfies InlangPlugin,
			"mock2.js": { key: "mock2" } satisfies InlangPlugin,
		},
	});

	expect(result.plugins.length).toBe(2);
	expect(result.plugins[0]?.key).toBe("mock");
	expect(result.plugins[1]?.key).toBe("mock2");
	// expecting no imports to be made
	expect(global.fetch).toHaveBeenCalledTimes(0);
	expect(result.errors.length).toBe(0);
});

test("it should preprocess a plugin", async () => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: true,
		text: vi.fn().mockResolvedValue("export default { key: 'mock' }"),
	});

	const result = await importPlugins({
		settings: {
			baseLocale: "en",
			locales: ["en"],
			modules: ["https://mock.com/module.js"],
		},
		preprocessPluginBeforeImport: async (moduleText) => {
			return moduleText.replace("mock", "preprocessed");
		},
	});

	expect(global.fetch).toHaveBeenCalledTimes(1);
	expect(result.plugins.length).toBe(1);
	expect(result.errors.length).toBe(0);
	expect(result.plugins[0]?.key).toBe("preprocessed");
});

test("if a fetch fails, a plugin import error is expected", async () => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: false,
		statusText: "HTTP 404",
	});

	const result = await importPlugins({
		settings: {
			baseLocale: "en",
			locales: ["en"],
			modules: ["https://mock.com/module.js"],
		},
	});

	expect(global.fetch).toHaveBeenCalledTimes(1);
	expect(result.plugins.length).toBe(0);
	expect(result.errors.length).toBe(1);
	expect(result.errors[0]).toBeInstanceOf(PluginImportError);
});
