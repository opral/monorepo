import { assert, beforeEach, describe, it } from "vitest";
import { listProjects } from "./listProjects.js";
// eslint-disable-next-line no-restricted-imports -- test
import fs from "node:fs/promises";
import type { ProjectSettings } from "../schema/settings.js";

const settings: ProjectSettings = {
	baseLocale: "en",
	locales: ["en"],
	modules: ["plugin.js", "lintRule.js"],
	"plugin.project.i18next": {
		pathPattern: "./examples/example01/{languageTag}.json",
		variableReferencePattern: ["{", "}"],
	},
};

beforeEach(async () => {
	await fs.rm("/user", { recursive: true, force: true });
});

describe("listProjects", () => {
	it("should find all projects a given path", async () => {
		await fs.mkdir("/user/dir1/project.inlang", { recursive: true });
		await fs.writeFile(
			"/user/dir1/project.inlang/settings.json",
			JSON.stringify(settings)
		);
		await fs.mkdir("/user/dir2/project.inlang", { recursive: true });
		await fs.writeFile(
			"/user/dir2/project.inlang/settings.json",
			JSON.stringify(settings)
		);

		await listProjects({ fs, from: "/user" }).then((projects) => {
			assert(projects.length === 2);
		});
	});

	it("should return objects inside of an array with the projectPath", async () => {
		await fs.mkdir("/user/dir1/project.inlang", { recursive: true });
		await fs.writeFile(
			"/user/dir1/project.inlang/settings.json",
			JSON.stringify(settings)
		);
		await fs.mkdir("/user/dir2/project.inlang", { recursive: true });
		await fs.writeFile(
			"/user/dir2/project.inlang/settings.json",
			JSON.stringify(settings)
		);

		await listProjects({ fs, from: "/user" }).then((projects) => {
			assert.isTrue(typeof projects[0] === "object");
			assert.isTrue(typeof projects[0]?.projectPath === "string");
		});
	});

	it("should limit the recursion depth to 5", async () => {
		await fs.mkdir("/user/dir1/dir2/dir3/dir4/dir5/dir6/project.inlang", {
			recursive: true,
		});
		await fs.writeFile(
			"/user/dir1/dir2/dir3/dir4/dir5/dir6/project.inlang/settings.json",
			JSON.stringify(settings)
		);

		await listProjects({ fs, from: "/user" }).then((projects) => {
			assert(projects.length === 0);
		});
	});

	it("should also find files inside of a dir that ends with *.inlang", async () => {
		await fs.mkdir("/user/dir1/go.inlang", { recursive: true });
		await fs.writeFile(
			"/user/dir1/go.inlang/settings.json",
			JSON.stringify(settings)
		);
		await fs.mkdir("/user/dir2/flutter.inlang", { recursive: true });
		await fs.writeFile(
			"/user/dir2/flutter.inlang/settings.json",
			JSON.stringify(settings)
		);

		await listProjects({ fs, from: "/user" }).then((projects) => {
			assert(projects.length === 2);
		});
	});
});
