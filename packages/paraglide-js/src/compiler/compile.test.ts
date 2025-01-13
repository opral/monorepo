import {
	loadProjectInMemory,
	newProject,
	saveProjectToDirectory,
} from "@inlang/sdk";
import { memfs } from "memfs";
import { test, expect, vi } from "vitest";
import { compile } from "./compile.js";
import { getAccountFilePath } from "../services/account/index.js";

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
