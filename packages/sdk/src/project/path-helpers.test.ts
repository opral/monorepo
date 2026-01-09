import { describe, expect, test } from "vitest";
import { Volume } from "memfs";
import { absolutePathFromProject, withAbsolutePaths } from "./path-helpers.js";

describe("absolutePathFromProject", () => {
	test("resolves relative paths against the project root", () => {
		const result = absolutePathFromProject(
			"/website/project.inlang",
			"./local-plugins/mock-plugin.js"
		);

		expect(result).toBe("/website/local-plugins/mock-plugin.js");
	});

	test("keeps absolute paths unchanged", () => {
		const result = absolutePathFromProject(
			"/website/project.inlang",
			"/shared/plugins/plugin.js"
		);

		expect(result).toBe("/shared/plugins/plugin.js");
	});
});

describe("withAbsolutePaths", () => {
	test("maps read/write operations to the project root", async () => {
		const volume = Volume.fromJSON({
			"/website/local-plugins/mock-plugin.js": "plugin code",
		});
		const mappedFs = withAbsolutePaths(
			volume.promises as any,
			"/website/project.inlang"
		);

		const content = await mappedFs.readFile("./local-plugins/mock-plugin.js");
		expect(content.toString()).toBe("plugin code");

		await mappedFs.writeFile("./local-plugins/new-plugin.js", "new plugin");
		const created = await volume.promises.readFile(
			"/website/local-plugins/new-plugin.js",
			"utf-8"
		);
		expect(created).toBe("new plugin");
	});
});
