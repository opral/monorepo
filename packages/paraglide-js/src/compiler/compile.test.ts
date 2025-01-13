import {
	loadProjectInMemory,
	newProject,
	saveProjectToDirectory,
} from "@inlang/sdk";
import { memfs } from "memfs";
import { test, expect, vi } from "vitest";
import { compile } from "./compile.js";
import { getAccountFilePath } from "../services/account/index.js";
import nodeFs from "node:fs";
import path from "node:path";

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
	expect(files).toEqual(expect.arrayContaining(["runtime.js", "messages.js"]));
});

test("loads a local account from app data if exists", async () => {
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

test("saves the local account to app data if not exists", async () => {
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

// the test exists to catch performance regressions
// and avoid issues like https://github.com/opral/inlang-paraglide-js/issues/306
test("compiling 100 messages takes less than 250ms", async () => {
	const baseline = measureBaselinePerformance();

	// time in ms
	const threshold = 250;
	// Adjust the threshold based on the baseline performance of the computer
	const adjustedThreshold = threshold + baseline;

	// the root of the repo
	const repositoryRoot = import.meta.url
		.slice(0, import.meta.url.lastIndexOf("inlang/packages"))
		.replace("file://", "");

	// load the inlang message format plugin to simulate a real project
	const pluginAsText = nodeFs.readFileSync(
		path.join(
			repositoryRoot,
			"inlang/packages/plugins/inlang-message-format/dist/index.js"
		),
		"utf8"
	);

	const mockMessages = Object.fromEntries(
		Array.from({ length: 100 }, (_, i) => [
			`message_${i}`,
			`Hello world {username}`,
		])
	);

	const fs = memfs({
		"/plugin.js": pluginAsText,
		"/en.json": JSON.stringify(mockMessages),
		"/project.inlang/settings.json": JSON.stringify({
			baseLocale: "en",
			locales: ["en"],
			modules: ["/plugin.js"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/{locale}.json",
			},
		}),
	}).fs as unknown as typeof import("node:fs");

	const start = performance.now();

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});

	const end = performance.now();

	const duration = end - start;

	expect(duration).toBeLessThan(adjustedThreshold);
});

/**
 * Calculate the baseline performance of the computer.
 *
 * The baseline performance is required to have reliable performance tests.
 * Otherwise, the performance of a computer can affect the test results.
 */
function measureBaselinePerformance() {
	const start = performance.now();

	// Perform a trivial operation to measure baseline
	for (let i = 0; i < 1e6; i++) {
		// Do nothing
	}

	const end = performance.now();
	return end - start;
}
