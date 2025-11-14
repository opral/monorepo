import {
	loadProjectInMemory,
	newProject,
	saveProjectToDirectory,
} from "@inlang/sdk";
import { memfs } from "memfs";
import { test, expect, vi } from "vitest";
import { compile } from "./compile.js";
import { getAccountFilePath } from "../services/account/index.js";
import type { Runtime } from "./runtime/type.js";
import { defaultCompilerOptions } from "./compiler-options.js";
import consola from "consola";

test("loads a project and compiles it", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	const fs = memfs().fs as unknown as typeof import("node:fs");

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});

	const files = await fs.promises.readdir("/output");

	//runtime.js and messages.js are always compiled with the default options
	expect(files).toEqual(
		expect.arrayContaining(["runtime.js", "server.js", "messages.js"])
	);
});

test.skip("loads a local account from app data if exists", async () => {
	const accountPath = getAccountFilePath();
	const fs = memfs({
		[accountPath]: JSON.stringify({ id: "mock", name: "test" }),
	}).fs as unknown as typeof import("node:fs");

	const spy = vi.spyOn(fs, "readFileSync");

	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});

	expect(spy).toHaveBeenCalledWith(accountPath, "utf8");
});

test.skip("saves the local account to app data if not exists", async () => {
	const accountPath = getAccountFilePath();
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});

	const account = JSON.parse(await fs.promises.readFile(accountPath, "utf8"));

	expect(account).toHaveProperty("id");
	expect(account).toHaveProperty("name");
});

test("cleans the output directory", async () => {
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const project = await loadProjectInMemory({
		blob: await newProject({}),
	});

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await fs.promises.mkdir("/output/subdir", { recursive: true });
	await fs.promises.writeFile("/output/subdir/x.js", "console.log('hello')");
	await fs.promises.writeFile("/output/y.js", "console.log('hello')");

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});

	const outputDir = await fs.promises.readdir("/output");
	const outputSubDir = fs.existsSync("/output/subdir");

	expect(outputDir).not.toContain("y.js");
	expect(outputSubDir).toBe(false);
});

test("doesn't clean the output directory if option is set to false", async () => {
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const project = await loadProjectInMemory({
		blob: await newProject({}),
	});

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await fs.promises.mkdir("/output/subdir", { recursive: true });
	await fs.promises.writeFile("/output/subdir/x.js", "console.log('hello')");
	await fs.promises.writeFile("/output/y.js", "console.log('hello')");

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		cleanOutdir: false,
		fs: fs,
	});

	const outputDir = await fs.promises.readdir("/output");
	const outputSubDir = fs.existsSync("/output/subdir");

	expect(outputDir).toContain("y.js");
	expect(outputSubDir).toBe(true);
});

test("throws if outdir resolves to the project root", async () => {
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const project = await loadProjectInMemory({
		blob: await newProject({}),
	});

	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

        await expect(
                compile({
                        project: "/project.inlang",
                        outdir: "./",
                        fs: fs,
                })
        ).rejects.toThrowError(
                /`outdir` cannot resolve to the project root \(".*"\)/
        );
        // Regression test for https://github.com/opral/inlang-sdk/issues/245
});

test("multiple compile calls do not interfere with each other", async () => {
	const fs = memfs().fs as unknown as typeof import("node:fs");

	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	// different project settings to test compile output
	await project.settings.set({
		...(await project.settings.get()),
		baseLocale: "de",
		locales: ["de"],
	});

	await saveProjectToDirectory({
		project,
		path: "/project2.inlang",
		fs: fs.promises,
	});

	const compilations = [
		compile({
			project: "/project.inlang",
			outdir: "/output",
			fs: fs,
		}),
		compile({
			project: "/project2.inlang",
			outdir: "/output",
			fs: fs,
		}),
	];

	await Promise.all(compilations);

	const runtimeFile = await fs.promises.readFile("/output/runtime.js", "utf8");

	const runtime = (await import(
		"data:text/javascript;base64," +
			Buffer.from(
				// replace the
				runtimeFile.replace(
					`import "@inlang/paraglide-js/urlpattern-polyfill";`,
					""
				),
				"utf-8"
			).toString("base64")
	)) as Runtime;

	// expecting the second compile step to overwrite the first
	expect(runtime.baseLocale).toBe("de");
	expect(runtime.locales).toEqual(["de"]);
});

test("emits additional files", async () => {
	const additionalFiles = {
		"adapter/component.svelte": "<script>console.log('hello')</script>",
		"adapter.js": "console.log('hello')",
	};

	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	const fs = memfs().fs as unknown as typeof import("node:fs");

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
		additionalFiles,
	});

	const outputDir = await fs.promises.readdir("/output");
	const adapterDir = await fs.promises.readdir("/output/adapter");

	expect(outputDir).toEqual(
		expect.arrayContaining([
			"runtime.js",
			"server.js",
			"messages.js",
			"adapter.js",
		])
	);

	expect(adapterDir).toEqual(["component.svelte"]);
});

test("includes eslint-disable comment", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	const fs = memfs().fs as unknown as typeof import("node:fs");

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		includeEslintDisableComment: true,
		fs: fs,
	});

	const messages = await fs.promises.readFile("/output/messages.js", "utf8");

	expect(messages).toContain("/* eslint-disable */");

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		includeEslintDisableComment: false,
		fs: fs,
	});

	const messagesWithoutComment = await fs.promises.readFile(
		"/output/messages.js",
		"utf8"
	);

	expect(messagesWithoutComment).not.toContain("/* eslint-disable */");
});

test("default compiler options should include cookied, variable and baseLocale to ensure easy try out of paraglide js, working both in server and browser environemnts", () => {
	// someone trying out paraglide js should be able to call `getLocale()` and `setLocale()`
	// without getting an error slammed in their face saying "define your strategy".
	//
	// instead, make the apis work out of the box and once the developer is convinced that
	// paraglide js is the right tool for them, they can then define their own strategy.

	expect(defaultCompilerOptions.strategy).toEqual([
		"cookie",
		"globalVariable",
		"baseLocale",
	]);
});

test("emits warnings for modules that couldn't be imported locally", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
				modules: ["./non-existent-paraglide-plugin.js"],
			},
		}),
	});

	const mock = vi.fn();

	consola.mockTypes(() => mock);

	const fs = memfs().fs as unknown as typeof import("node:fs");

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});

	expect(mock).toHaveBeenCalled();
});

test("emits warnings for modules that couldn't be imported via http", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
				modules: ["https://example.com/non-existent-paraglide-plugin.js"],
			},
		}),
	});

	const mock = vi.fn();

	consola.mockTypes(() => mock);

	const fs = memfs().fs as unknown as typeof import("node:fs");
	const fetchMock = vi.fn().mockRejectedValue(new TypeError("network error"));
	vi.stubGlobal("fetch", fetchMock);

	const errorsSpy = vi.spyOn(project.errors, "get").mockResolvedValue([
		{
			message:
				"Failed to import module https://example.com/non-existent-paraglide-plugin.js",
		} as any,
	]);

	// save project to directory to test loading
	await saveProjectToDirectory({
		project,
		path: "/project.inlang",
		fs: fs.promises,
	});

	try {
		await compile({
			project: "/project.inlang",
			outdir: "/output",
			fs: fs,
		});
	} finally {
		vi.unstubAllGlobals();
		errorsSpy.mockRestore();
	}

	expect(mock).toHaveBeenCalled();
});
