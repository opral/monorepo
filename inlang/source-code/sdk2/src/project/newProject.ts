import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import type { ProjectSettings } from "../schema/settings.js";
import {
	contentFromDatabase,
	createInMemoryDatabase,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";
import { createSchema } from "../database/createSchema.js";

/**
 * Creates a new inlang project.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newProject(args?: {
	settings?: ProjectSettings;
}): Promise<Blob> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	try {
		await createSchema({ db, sqlite });

		const inlangDbContent = contentFromDatabase(sqlite);

		const lix = await openLixInMemory({ blob: await newLixFile() });

		// write files to lix
		await lix.db
			.insertInto("file")
			.values([
				{
					path: "/db.sqlite",
					data: inlangDbContent,
				},
				{
					path: "/settings.json",
					data: await new Blob([
						JSON.stringify(args?.settings ?? defaultProjectSettings),
					]).arrayBuffer(),
				},
			])
			.execute();
		return lix.toBlob();
	} catch (e) {
		throw new Error(`Failed to create new inlang project: ${e}`, { cause: e });
	} finally {
		sqlite.close();
		await db.destroy();
	}
}

const defaultProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	baseLocale: "en",
	locales: ["en", "de"],
	modules: [
		// for instant gratification, we're adding common rules
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
		// default to the message format plugin because it supports all features
		// "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
		// the m function matcher should be installed by default in case Sherlock (VS Code extension) is adopted
		// "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js",
	],
} satisfies ProjectSettings;
