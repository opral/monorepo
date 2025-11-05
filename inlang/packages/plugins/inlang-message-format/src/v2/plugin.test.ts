// @ts-nocheck

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "node:test";
import { pluginId } from "./plugin.js";
import type { PluginSettings } from "../settings.js";
import { FileSchema } from "../fileSchema.js";
import { Value } from "@sinclair/typebox/value";
import { Volume } from "memfs";
import { createMessageV1 as createMessage } from "@inlang/sdk";

beforeEach(() => {
	// clear plugin state between tests
	vi.resetModules();
	process.cwd = () => "/";
});

// the test ensures:
//   - messages can be loaded
//   - messages can be saved
//   - after loading and saving messages, the state is the same as before (roundtrip)
test("roundtrip (saving/loading messages)", async () => {
	const { plugin } = await import("./plugin.js");
	const fs = Volume.fromJSON({}).promises;

	process.cwd = () => "/";

	const settings = {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		modules: [],
		[pluginId]: {
			pathPattern: "./messages/{languageTag}.json",
		} satisfies PluginSettings,
	};

	const enInitial = JSON.stringify({
		$schema: "https://inlang.com/schema/inlang-message-format",
		first_message: "If this fails I will be sad",
		second_message: "Let's see if this works",
	} satisfies FileSchema);

	const deInitial = JSON.stringify({
		$schema: "https://inlang.com/schema/inlang-message-format",
		second_message: "Mal sehen ob das funktioniert",
	} satisfies FileSchema);

	await fs.mkdir("./messages");
	await fs.writeFile("./messages/en.json", enInitial);
	await fs.writeFile("./messages/de.json", deInitial);

	const firstMessageLoad = await plugin.loadMessages!({
		settings,
		nodeishFs: fs,
	});

	expect(firstMessageLoad).toStrictEqual([
		createMessage("first_message", {
			en: "If this fails I will be sad",
		}),
		createMessage("second_message", {
			en: "Let's see if this works",
			de: "Mal sehen ob das funktioniert",
		}),
	]);

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages: firstMessageLoad,
	});

	const enAfterRoundtrip = JSON.parse(
		await fs.readFile("./messages/en.json", { encoding: "utf-8" })
	);
	const deAfterRoundtrip = JSON.parse(
		await fs.readFile("./messages/de.json", { encoding: "utf-8" })
	);

	expect(enAfterRoundtrip).toStrictEqual(JSON.parse(enInitial));
	expect(deAfterRoundtrip).toStrictEqual(JSON.parse(deInitial));
	expect(Value.Check(FileSchema, enAfterRoundtrip)).toBe(true);
	expect(Value.Check(FileSchema, deAfterRoundtrip)).toBe(true);

	const messagesAfterRoundtrip = await plugin.loadMessages!({
		settings,
		nodeishFs: fs,
	});

	expect(messagesAfterRoundtrip).toStrictEqual(firstMessageLoad);
});

test.skip("keep the json formatting to decrease git diff's and merge conflicts", async () => {
	const { plugin } = await import("./plugin.js");
	const fs = Volume.fromJSON({}).promises;

	const settings = {
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: [],
		[pluginId]: {
			pathPattern: "./messages/{languageTag}.json",
		} satisfies PluginSettings,
	} as any;

	// double tab indentation
	const initialFile = JSON.stringify(
		{
			$schema: "https://inlang.com/schema/inlang-message-format",
			hello_world: "hello",
		} satisfies FileSchema,
		undefined,
		2
	);

	await fs.mkdir("./messages");
	await fs.writeFile("./messages/en.json", initialFile);

	const messages = await plugin.loadMessages!({
		settings,
		nodeishFs: fs,
	});

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages,
	});

	const fileAfterRoundtrip = await fs.readFile("./messages/en.json", {
		encoding: "utf-8",
	});

	// the file should still tab indentation
	expect(fileAfterRoundtrip).toStrictEqual(initialFile);
	// @ts-expect-error - memfs type error
	expect(Value.Check(FileSchema, JSON.parse(fileAfterRoundtrip))).toBe(true);
});

test("don't throw if the storage path does not exist. instead, create the file and/or folder (enables project initialization usage)", async () => {
	for (const path of [
		"./{languageTag}/main.json",
		"./messages/{languageTag}.json",
		"./folder/folder/{languageTag}.json",
	]) {
		const { plugin } = await import("./plugin.js");
		const fs = Volume.fromJSON({}).promises;

		const messages = await plugin.loadMessages!({
			settings: {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: [],
				[pluginId]: { pathPattern: path } satisfies PluginSettings,
			},
			nodeishFs: fs,
		});

		expect(messages).toStrictEqual([]);

		messages.push(createMessage("hello_world", { en: "hello" }));

		await plugin.saveMessages!({
			settings: {
				[pluginId]: { pathPattern: path } satisfies PluginSettings,
			} as any,
			nodeishFs: fs,
			messages,
		});

		const createdFile = await fs.readFile(path.replace("{languageTag}", "en"), {
			encoding: "utf-8",
		});
		// @ts-expect-error - memfs type error
		const parsedFile = JSON.parse(createdFile);
		// messages should be empty but no error should be thrown
		expect(messages).toStrictEqual([
			createMessage("hello_world", { en: "hello" }),
		]);
		expect(Value.Check(FileSchema, parsedFile)).toBe(true);
	}
});

test("throws if json has a trailing comma", async () => {
	const { plugin } = await import("./plugin.js");
	const fs = Volume.fromJSON({}).promises;

	const settings = {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		modules: [],
		[pluginId]: {
			pathPattern: "./messages/{languageTag}.json",
		} satisfies PluginSettings,
	};

	const enInitial = JSON.stringify({
		$schema: "https://inlang.com/schema/inlang-message-format",
		first_message: "If this works I will be sad",
		second_message: "Let's see if this blows up",
	} satisfies FileSchema);

	let deInitial = JSON.stringify({
		$schema: "https://inlang.com/schema/inlang-message-format",
		second_message: "Mal sehen ob das knallt",
	} satisfies FileSchema);

	// inject trailing comma
	deInitial = deInitial.slice(0, -1) + ",}";

	await fs.mkdir("./messages");
	await fs.writeFile("./messages/en.json", enInitial);
	await fs.writeFile("./messages/de.json", deInitial);

	try {
		await plugin.loadMessages!({
			settings,
			nodeishFs: fs,
		});
		throw new Error("loadMessages should have thrown");
	} catch (e) {
		expect((e as Error).message).not.toBe("loadMessages should have thrown");
	}
});

test("recursively creating a directory should not fail if a subpath already exists", async () => {
	const { plugin } = await import("./plugin.js");
	const fs = Volume.fromJSON({}).promises;
	// folder-a exists but folder-b doesn't
	const path = "./folder-a/folder-b/{languageTag}.json";

	await fs.mkdir("./folder-a/");
	await fs.writeFile("./folder-a/placeholder.txt", "hi");

	await plugin.saveMessages!({
		settings: {
			sourceLanguageTag: "en",
			languageTags: ["en"],
			modules: [],
			[pluginId]: { pathPattern: path } satisfies PluginSettings,
		},
		nodeishFs: fs,
		messages: [
			createMessage("hello_world", {
				en: "hello",
			}),
		],
	});

	const createdFile = await fs.readFile(path.replace("{languageTag}", "en"), {
		encoding: "utf-8",
	});
	// @ts-expect-error - memfs type error
	const parsedFile = JSON.parse(createdFile);
	// messages should be empty but no error should be thrown
	expect(parsedFile.hello_world).toEqual("hello");
	expect(Value.Check(FileSchema, parsedFile)).toBe(true);
});

// adds typesafety in IDEs
test("it should add the $schema property to the file if it does not exist", async () => {
	const { plugin } = await import("./plugin.js");

	const fs = Volume.fromJSON({}).promises;

	const settings = {
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: [],
		[pluginId]: {
			pathPattern: "./messages/{languageTag}.json",
		} satisfies PluginSettings,
	};

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages: [
			createMessage("hello_world", {
				en: "hello",
			}),
		],
	});

	const fileAfterSave = await fs.readFile("./messages/en.json", {
		encoding: "utf-8",
	});
	// @ts-expect-error - memfs type error
	const json = JSON.parse(fileAfterSave) as FileSchema;
	expect(json.$schema).toBe("https://inlang.com/schema/inlang-message-format");
	expect(Object.keys(json).length).toBe(2);
	expect(Value.Check(FileSchema, json)).toBe(true);
});

test("it should migrate to v2", async () => {
	const { plugin } = await import("./plugin.js");
	const fs = Volume.fromJSON({}).promises;

	const messages = [
		createMessage("greeting", {
			en: "Hello",
			de: "Guten Tag",
			"en-US": "Howdy",
		}),
	];

	await fs.writeFile(
		"/messages.json",
		JSON.stringify({
			data: messages,
		})
	);

	const loadedMessages = await plugin.loadMessages!({
		settings: {
			sourceLanguageTag: "en",
			languageTags: ["en", "de", "en-US"],
			modules: [],
			[pluginId]: {
				filePath: "./messages.json",
				pathPattern: "./i18n/{languageTag}.json",
			} satisfies PluginSettings,
		},
		nodeishFs: fs,
	});

	expect(loadedMessages).toStrictEqual(messages);

	const en = await fs.readFile("./i18n/en.json", { encoding: "utf-8" });
	const de = await fs.readFile("./i18n/de.json", { encoding: "utf-8" });
	const enUS = await fs.readFile("./i18n/en-US.json", { encoding: "utf-8" });

	// @ts-expect-error - memfs type error
	expect(JSON.parse(en)).toStrictEqual({
		$schema: "https://inlang.com/schema/inlang-message-format",
		greeting: "Hello",
	} satisfies FileSchema);

	// @ts-expect-error - memfs type error
	expect(JSON.parse(de)).toStrictEqual({
		$schema: "https://inlang.com/schema/inlang-message-format",
		greeting: "Guten Tag",
	} satisfies FileSchema);

	// @ts-expect-error - memfs type error
	expect(JSON.parse(enUS)).toStrictEqual({
		$schema: "https://inlang.com/schema/inlang-message-format",
		greeting: "Howdy",
	} satisfies FileSchema);

	// if the files exist already, the load function should not throw
	await plugin.loadMessages!({
		settings: {
			sourceLanguageTag: "en",
			languageTags: ["en", "de", "en-US"],
			modules: [],
			[pluginId]: {
				filePath: "./messages.json",
				pathPattern: "./i18n/{languageTag}.json",
			} satisfies PluginSettings,
		},
		nodeishFs: fs,
	});
});
