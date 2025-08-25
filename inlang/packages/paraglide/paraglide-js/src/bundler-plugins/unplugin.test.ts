import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { paraglideVitePlugin } from "../bundler-plugins/vite.js";
import consola from "consola";
import { memfs } from "memfs";
import {
	loadProjectInMemory,
	newProject,
	saveProjectToDirectory,
} from "@inlang/sdk";

let originalNodeEnv: string | undefined;

beforeEach(() => {
	originalNodeEnv = process.env.NODE_ENV;

	// Mock logging methods to suppress error messages in tests
	consola.mockTypes(() => vi.fn());
});

afterEach(() => {
	if (originalNodeEnv !== undefined) {
		process.env.NODE_ENV = originalNodeEnv;
	} else {
		delete process.env.NODE_ENV;
	}
});

test("vite plugin does not throw when compilation is successful", async () => {
	// Create and save a viable project to the virtual file system
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	const fs = memfs().fs as unknown as typeof import("node:fs");

	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	const plugin = paraglideVitePlugin({
		project: "/project.inlang",
		outdir: "/test-output",
		fs: fs,
	}) as any;

	const mockContext = {
		addWatchFile: () => {},
	};

	await expect(plugin.buildStart?.call(mockContext)).resolves.toBeUndefined();
});

test("vite plugin does not throw on compilation errors in development", async () => {
	process.env.NODE_ENV = "development";

	// Use memfs with no project (simulates missing project)
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const plugin = paraglideVitePlugin({
		project: "/non-existent-project.inlang",
		outdir: "/test-output",
		fs: fs,
	}) as any;

	const mockContext = {
		addWatchFile: () => {},
	};

	// In development mode - should catch errors and NOT throw
	await expect(plugin.buildStart?.call(mockContext)).resolves.toBeUndefined();
});

test("vite plugin throws on compilation errors at build time", async () => {
	process.env.NODE_ENV = "production";

	// Use memfs with no project (simulates missing project)
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const plugin = paraglideVitePlugin({
		project: "/non-existent-project.inlang",
		outdir: "/test-output",
		fs: fs,
	}) as any;

	const mockContext = {
		addWatchFile: () => {},
	};

	// In production mode - should throw the error
	await expect(plugin.buildStart?.call(mockContext)).rejects.toThrow();
});
