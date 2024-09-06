import { expect, test } from "vitest";
import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { validate } from "uuid";

test("it should persist changes of bundles, messages, and variants to lix ", async () => {
	const file1 = await newProject();
	const project1 = await loadProjectInMemory({ blob: file1 });
	const bundle = await project1.db
		.insertInto("bundle")
		.values({
			alias: { default: "bundle1" },
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const message = await project1.db
		.insertInto("message")
		.values({
			bundleId: bundle.id,
			locale: "en",
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	await project1.db
		.insertInto("variant")
		.values({
			messageId: message.id,
			match: {},
			pattern: [],
		})
		.execute();

	await project1.settled();

	const file1AfterUpdates = await project1.toBlob();
	await project1.close();

	const project2 = await loadProjectInMemory({ blob: file1AfterUpdates });
	const bundles = await project2.db.selectFrom("bundle").select("id").execute();
	const messages = await project2.db
		.selectFrom("message")
		.select("id")
		.execute();
	const variants = await project2.db
		.selectFrom("variant")
		.select("id")
		.execute();
	expect(bundles.length).toBe(1);
	expect(messages.length).toBe(1);
	expect(variants.length).toBe(1);
});

test("get and set settings", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const settings = await project.settings.get();

	expect(settings["plugin.key"]).toBeUndefined();

	const copied = structuredClone(settings);

	copied["plugin.key"] = { test: "value" };

	await project.settings.set(copied);

	const updatedSettings = await project.settings.get();
	expect(updatedSettings["plugin.key"]).toEqual({ test: "value" });
});

test("it should set sourceLanguageTag and languageTags if non-existent to make v1 plugins work", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});
	const settings = await project.settings.get();
	expect(settings.baseLocale).toBe("en");
	expect(settings.sourceLanguageTag).toBe("en");
	expect(settings.languageTags).toEqual(["en", "de"]);
	expect(settings.locales).toEqual(["en", "de"]);
});

test("providing plugins should work", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en"],
				modules: [],
			},
		}),
		providePlugins: [{ key: "my-provided-plugin" }],
	});

	const plugins = await project.plugins.get();
	const errors = await project.errors.get();

	expect(plugins.length).toBe(1);
	expect(plugins[0]?.key).toBe("my-provided-plugin");
	expect(errors.length).toBe(0);
});

test("if a project has no id, it should be generated", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.lix.db
		.deleteFrom("file_internal")
		.where("path", "=", "/project_id")
		.execute();

	const blob = await project.toBlob();

	const project2 = await loadProjectInMemory({ blob });

	const id = await project2.id.get();

	expect(id).toBeDefined();
	expect(validate(id)).toBe(true);
});

test("subscribing to errors should work", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	expect(await project.errors.get()).toEqual([]);

	let errorsFromSub: readonly Error[] = [];
	project.errors.subscribe((value) => {
		errorsFromSub = value;
	});

	await project.lix.db
		.updateTable("file_internal")
		.where("path", "=", "/settings.json")
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({
					baseLocale: "en",
					locales: ["en"],
					modules: ["invalid-module.js"],
				})
			),
		})
		.execute();

	const errors = await project.errors.get();

	expect(errors.length).toBe(1);
	expect(errorsFromSub.length).toBe(1);
	expect(errorsFromSub).toStrictEqual(errors);
});
