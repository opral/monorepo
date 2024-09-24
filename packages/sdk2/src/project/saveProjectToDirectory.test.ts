import { test, expect, vi } from "vitest";
import { saveProjectToDirectory } from "./saveProjectToDirectory.js";
import { Volume } from "memfs";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { newProject } from "./newProject.js";
import type { InlangPlugin } from "../plugin/schema.js";
import type { NewBundleNested } from "../database/schema.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";
import { loadProjectFromDirectory } from "./loadProjectFromDirectory.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { MessageV1 } from "../json-schema/old-v1-message/schemaV1.js";

test("it should throw if the path doesn't end with .inlang", async () => {
	expect(() =>
		saveProjectToDirectory({
			fs: {} as any,
			project: {} as any,
			path: "/foo/bar",
		})
	).rejects.toThrowError("The path must end with .inlang");
});

test("it should overwrite all files to the directory except the db.sqlite file", async () => {
	const mockFs = Volume.fromJSON({
		"/foo/bar.inlang/settings.json": JSON.stringify({
			baseLocale: "en",
			locales: ["en"],
		}),
	}).promises as any;

	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "mock"],
			},
		}),
	});

	await saveProjectToDirectory({
		fs: mockFs,
		project,
		path: "/foo/bar.inlang",
	});

	const files = await mockFs.readdir("/foo/bar.inlang");
	const updatedSettingsFile = await mockFs.readFile(
		"/foo/bar.inlang/settings.json",
		"utf-8"
	);
	const updatedSettings = JSON.parse(updatedSettingsFile);

	// only testing known files at the time of the test.
	// this test should be updated for files that should NOT
	// be contained in the directory in the future
	expect(files).toContain("settings.json");
	expect(files).not.toContain("db.sqlite");
	expect(updatedSettings.baseLocale).toBe("en");
	expect(updatedSettings.locales).toEqual(["en", "fr", "mock"]);
});

test("a roundtrip should work", async () => {
	const mockBundleNested: NewBundleNested = {
		id: "mock-bundle",
		messages: [
			{
				bundleId: "mock-bundle",
				locale: "en",
				selectors: [],
				variants: [],
			},
		],
	};

	const volume = Volume.fromJSON({
		"/mock-file.json": JSON.stringify([mockBundleNested]),
	});

	const mockPlugin: InlangPlugin = {
		key: "mock-plugin",
		toBeImportedFiles: async () => {
			return [{ path: "/mock-file.json", locale: "mock" }];
		},
		importFiles: async ({ files }) => {
			const bundles = JSON.parse(new TextDecoder().decode(files[0]?.content));
			return { bundles };
		},
		exportFiles: async ({ bundles }) => {
			return [
				{
					content: new TextEncoder().encode(JSON.stringify(bundles)),
					name: "mock-file.json",
					locale: "mock",
				},
			];
		},
	};

	const exportFilesSpy = vi.spyOn(mockPlugin, "exportFiles");
	const importFilesSpy = vi.spyOn(mockPlugin, "importFiles");

	const project = await loadProjectInMemory({
		blob: await newProject(),
		providePlugins: [mockPlugin],
	});

	await insertBundleNested(project.db, mockBundleNested);

	await saveProjectToDirectory({
		fs: volume.promises as any,
		project,
		path: "/foo/bar.inlang",
	});

	// const fileTree = volume.toJSON();

	expect(exportFilesSpy).toHaveBeenCalled();
	expect(importFilesSpy).not.toHaveBeenCalled();

	// TODO deactivated since mockBundleNested no longer contains the id of the messages
	// expect(fileTree).toEqual(
	// 	expect.objectContaining({
	// 		"/foo/mock-file.json": JSON.stringify([mockBundleNested]),
	// 	})
	// );

	// testing roundtrip

	const project2 = await loadProjectFromDirectory({
		fs: volume as any,
		path: "/foo/bar.inlang",
		providePlugins: [mockPlugin],
	});

	expect(mockPlugin.importFiles).toHaveBeenCalled();

	const bundles = await selectBundleNested(project2.db).execute();

	for (const bundle of bundles) {
		for (const message of bundle.messages) {
			delete (message as any).id; // Remove the dynamic id field
		}
	}

	expect(bundles).toEqual([expect.objectContaining(mockBundleNested)]);
});

test.todo(
	"a roundtrip with legacy load and save messages should work",
	async () => {
		const mockMessageV1: MessageV1 = {
			id: "mock-legacy-message",
			alias: {},
			selectors: [],
			variants: [
				{
					languageTag: "en",
					match: [],
					pattern: [{ type: "Text", value: "Hello from legacy message" }],
				},
			],
		};

		const volume = Volume.fromJSON({
			"/foo/bar.inlang/settings.json": JSON.stringify({
				baseLocale: "en",
				locales: ["en"],
			} satisfies ProjectSettings),
			"/foo/i18n/en.json": JSON.stringify([mockMessageV1]),
		});

		const mockPlugin: InlangPlugin = {
			id: "mock-legacy-plugin",
			key: "mock-legacy-plugin",
			loadMessages: async ({ nodeishFs }) => {
				// expecting `loadMessages` to transform the relative path
				// to an absolute path `./i18n/en.json` -> `/foo/i18n/en.json`
				const file = await nodeishFs.readFile("./i18n/en.json", {
					encoding: "utf-8",
				});
				return JSON.parse(file as string);
			},
			saveMessages: async ({ messages, nodeishFs }) => {
				await nodeishFs.writeFile(
					"./i18n/en.json",
					new TextEncoder().encode(JSON.stringify(messages))
				);
			},
		};

		const loadMessagesSpy = vi.spyOn(mockPlugin, "loadMessages");
		const saveMessagesSpy = vi.spyOn(mockPlugin, "saveMessages");

		const project = await loadProjectFromDirectory({
			fs: volume as any,
			path: "/foo/bar.inlang",
			providePlugins: [mockPlugin],
		});

		expect(loadMessagesSpy).toHaveBeenCalled();
		expect(saveMessagesSpy).not.toHaveBeenCalled();

		const bundles1 = await selectBundleNested(project.db).execute();

		expect(bundles1[0]?.messages).lengthOf(1);
		expect(bundles1[0]?.messages[0]?.variants).toEqual([
			expect.objectContaining({
				pattern: [
					{
						type: "text",
						value: "Hello from legacy message",
					},
				],
			}),
		]);

		// await project.db
		// 	.updateTable("variant")
		// 	.set({
		// 		pattern: [{ type: "text", value: "Updated message" }],
		// 	})
		// 	.where("id", "=", bundles1[0]?.messages[0]?.variants[0]?.id as string)
		// 	.execute();

		// testing the saveMessages function by removing the en.json file
		await volume.promises.rm("/foo/i18n/en.json");

		await saveProjectToDirectory({
			fs: volume.promises as any,
			project,
			path: "/foo/bar.inlang",
		});

		expect(saveMessagesSpy).toHaveBeenCalled();

		const fileTree = volume.toJSON();
		const parsed = JSON.parse(fileTree["/foo/i18n/en.json"] as string);

		expect(parsed).toEqual(expect.objectContaining([mockMessageV1]));

		// testing roundtrip

		const project2 = await loadProjectFromDirectory({
			fs: volume as any,
			path: "/foo/bar.inlang",
			providePlugins: [mockPlugin],
		});

		const bundles2 = await selectBundleNested(project2.db).execute();

		// TODO deactivated since the ids must not be equal for separate imports - matching happens on language and matcher now
		expect(bundles1).toStrictEqual(bundles2);
	}
);

test("it should preserve the formatting of existing json resource files", async () => {
	const mockJson =
		JSON.stringify(
			{ key: "value" },
			undefined,
			// tab spacing
			"\t"
		) +
		// ends with new line
		"\n";

	const mockPlugin: InlangPlugin = {
		key: "mock",
		exportFiles: async () => {
			return [
				{
					name: "en.json",
					// no beautified json
					content: new TextEncoder().encode(JSON.stringify({ key: "value" })),
					locale: "en",
				},
			];
		},
	};

	const volume = Volume.fromJSON({
		"/foo/project.inlang/settings.json": JSON.stringify({
			baseLocale: "en",
			locales: ["en"],
		} satisfies ProjectSettings),
		"/foo/en.json": mockJson,
	});

	const project = await loadProjectInMemory({
		blob: await newProject(),
		providePlugins: [mockPlugin],
	});

	await saveProjectToDirectory({
		path: "/foo/project.inlang",
		fs: volume.promises as any,
		project,
	});

	const fileAfterSave = await volume.promises.readFile("/foo/en.json", "utf-8");
	expect(fileAfterSave).toBe(mockJson);
});