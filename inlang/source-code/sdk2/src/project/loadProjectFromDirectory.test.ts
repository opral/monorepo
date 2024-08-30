/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest";
import { ProjectSettings } from "../json-schema/settings.js";
import { Volume } from "memfs";
import { loadProjectFromDirectory } from "./loadProjectFromDirectory.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";
import { Text } from "../json-schema/pattern.js";
import type { InlangPlugin } from "../plugin/schema.js";
import type {
	MessageV1,
	VariantV1,
} from "../json-schema/old-v1-message/schemaV1.js";

test("plugin.loadMessages and plugin.saveMessages must not be condigured together with import export", async () => {
	const mockLegacyPlugin: InlangPlugin = {
		key: "mock-legacy-plugin",
		loadMessages: async () => {
			return [];
		},
		saveMessages: async () => {},
	};

	const mockLegacyPlugin2: InlangPlugin = {
		key: "mock-legacy-plugin-2",
		loadMessages: async () => {
			return [];
		},
		saveMessages: async () => {},
	};

	const mockImportExportPlugin: InlangPlugin = {
		key: "mock-import-export-plugin",
		exportFiles: () => {
			return [];
		},
		importFiles: () => {
			return {} as any;
		},
	};

	await expect(
		(async () => {
			await loadProjectFromDirectory({
				fs: Volume.fromJSON({
					"./project.inlang/settings.json": JSON.stringify({
						baseLocale: "en",
						locales: ["en", "de"],
						modules: [],
					} satisfies ProjectSettings),
				}) as any,
				path: "./project.inlang",
				providePlugins: [
					mockLegacyPlugin,
					mockLegacyPlugin2,
					mockImportExportPlugin,
				],
			});
		})()
	).rejects.toThrowError();

	await expect(
		(async () => {
			await loadProjectFromDirectory({
				fs: Volume.fromJSON({
					"./project.inlang/settings.json": JSON.stringify({
						baseLocale: "en",
						locales: ["en", "de"],
						modules: [],
					} satisfies ProjectSettings),
				}) as any,
				path: "./project.inlang",
				providePlugins: [
					mockLegacyPlugin,
					mockLegacyPlugin2,
					mockImportExportPlugin,
				],
			});
		})()
	).rejects.toThrowError();
});

test("plugin.loadMessages and plugin.saveMessages should work for legacy purposes", async () => {
	const mockLegacyPlugin: InlangPlugin = {
		id: "mock-legacy-plugin",
		// @ts-expect-error - id is deprecated, key can be undefined
		key: undefined,
		loadMessages: async ({ nodeishFs, settings }) => {
			const pathPattern = settings["plugin.mock-plugin"]?.pathPattern as string;

			const messages: MessageV1[] = [];

			// @ts-expect-error - language tag is always given by the sdk v2
			for (const languageTag of settings.languageTags) {
				const data = await nodeishFs.readFile(
					pathPattern.replace("{languageTag}", languageTag)
				);

				for (const [key, value] of Object.entries(
					JSON.parse(data.toString())
				)) {
					const exisitngMessage = messages.find(
						(message) => message.id === key
					);
					const variant = {
						languageTag: languageTag,
						match: [],
						pattern: [{ type: "Text", value: value }],
					} as VariantV1;
					if (exisitngMessage !== undefined) {
						exisitngMessage.variants.push(variant);
					} else {
						messages.push({
							alias: {},
							id: key,
							selectors: [],
							variants: [variant],
						});
					}
				}
			}

			return messages;
		},
		saveMessages: async () => {},
	};
	const mockRepo = {
		"./README.md": "# Hello World",
		"./src/index.js": "console.log('Hello World')",
		"./src/translations/en.json": JSON.stringify({
			key1: "value1",
			key2: "value2",
		}),
		"./src/translations/de.json": JSON.stringify({
			key1: "wert1",
			key2: "wert2",
		}),
		"./project.inlang/settings.json": JSON.stringify({
			baseLocale: "en",
			locales: ["en", "de"],
			modules: ["./mock-module.js"],
			"plugin.mock-plugin": {
				pathPattern: "./src/translations/{languageTag}.json",
			},
		} satisfies ProjectSettings),
	};
	const fs = Volume.fromJSON(mockRepo);
	const project = await loadProjectFromDirectory({
		fs: fs as any,
		path: "./project.inlang",
		providePlugins: [mockLegacyPlugin],
	});

	const bundles = await selectBundleNested(project.db).execute();

	const bundlesOrdered = bundles.sort((a, b) =>
		a.alias[mockLegacyPlugin.id!]!.localeCompare(b.alias[mockLegacyPlugin.id!]!)
	);

	// expect the alias to be the key or id (as fallback) of the plugin
	// see https://github.com/opral/monorepo/pull/3048#discussion_r1707395555
	for (const bundle of bundles) {
		expect(Object.keys(bundle.alias)).toEqual([mockLegacyPlugin.id!]);
	}

	expect(bundles.length).toBe(2);
	expect(bundlesOrdered[0]?.alias[mockLegacyPlugin.id!]).toBe("key1");
	expect(bundlesOrdered[1]?.alias[mockLegacyPlugin.id!]).toBe("key2");
	expect(bundlesOrdered[0]?.messages[0]?.locale).toBe("en");
	expect(
		(bundlesOrdered[0]?.messages[0]?.variants[0]?.pattern[0] as Text)?.value
	).toBe("value1");

	expect(bundlesOrdered[0]?.messages[1]?.locale).toBe("de");
	expect(
		(bundlesOrdered[0]?.messages[1]?.variants[0]?.pattern[0] as Text)?.value
	).toBe("wert1");

	expect(bundlesOrdered[1]?.messages[0]?.locale).toBe("en");
	expect(
		(bundlesOrdered[1]?.messages[0]?.variants[0]?.pattern[0] as Text)?.value
	).toBe("value2");

	expect(bundlesOrdered[1]?.messages[1]?.locale).toBe("de");
	expect(
		(bundlesOrdered[1]?.messages[1]?.variants[0]?.pattern[0] as Text)?.value
	).toBe("wert2");
});

test("it should keep files between the inlang directory and lix in sync", async () => {
	const mockSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		modules: [],
	} satisfies ProjectSettings;

	const mockDirectory = {
		"/project.inlang/cache/plugin/29j49j2": "cache value",
		"/project.inlang/.gitignore": "git value",
		"/project.inlang/prettierrc.json": "prettier value",
		"/project.inlang/README.md": "readme value",
		"/project.inlang/settings.json": JSON.stringify(mockSettings),
	};
	const fs = Volume.fromJSON(mockDirectory);
	const project = await loadProjectFromDirectory({
		fs: fs as any,
		path: "/project.inlang",
	});

	const files = await project.lix.db.selectFrom("file").selectAll().execute();

	expect(files.length).toBe(5 + 1 /* the db.sqlite file */);

	const filesByPath = files.reduce((acc, file) => {
		acc[file.path] = new TextDecoder().decode(file.data);
		return acc;
	}, {} as any);

	expect(filesByPath["/cache/plugin/29j49j2"]).toBe("cache value");
	expect(filesByPath["/.gitignore"]).toBe("git value");
	expect(filesByPath["/prettierrc.json"]).toBe("prettier value");
	expect(filesByPath["/README.md"]).toBe("readme value");
	expect(filesByPath["/settings.json"]).toBe(JSON.stringify(mockSettings));

	// changes to a file on disk should reflect in lix
	fs.writeFileSync(
		"/project.inlang/settings.json",
		JSON.stringify({ ...mockSettings, baseLocale: "brand-new-locale" })
	);
	const fileInLix = await project.lix.db
		.selectFrom("file")
		.selectAll()
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const settingsAfterUpdateOnDisk = JSON.parse(
		new TextDecoder().decode(fileInLix.data)
	);

	expect(settingsAfterUpdateOnDisk.baseLocale).toBe("brand-new-locale");

	fs.writeFileSync("/project.inlang/random-file.txt", "random value", {
		encoding: "utf-8",
	});

	const f = fs.readFileSync("/project.inlang/random-file.txt");

	console.log({ f: f.toString() });

	await new Promise((resolve) => setTimeout(resolve, 100));

	const randomFileInLix = await project.lix.db
		.selectFrom("file")
		.selectAll()
		.where("path", "=", "/random-file.txt")
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(randomFileInLix.data)).toBe("random value");

	// changes to a file in lix should reflect in the project directory
	await project.lix.db
		.updateTable("file")
		.where("path", "=", "/settings.json")
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({ ...mockSettings, baseLocale: "brand-new-locale" })
			),
		})
		.execute();

	const fileOnDisk = fs.readFileSync("/project.inlang/settings.json");
	const settings = JSON.parse(fileOnDisk.toString());

	expect(settings.baseLocale).toBe("brand-new-locale");
});
