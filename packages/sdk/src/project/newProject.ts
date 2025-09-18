import { newLixFile, openLix } from "@lix-js/sdk";
import type { ProjectSettings } from "../json-schema/settings.js";
import { initDb } from "../database/initDb.js";
import { InlangBundleSchema } from "../schema-definitions/bundle.js";
import { InlangMessageSchema } from "../schema-definitions/message.js";
import { InlangVariantSchema } from "../schema-definitions/variant.js";

/**
 * Creates a new inlang project.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newProject(args?: {
	settings?: ProjectSettings;
}): Promise<Blob> {
	const lix = await openLix({
		blob: await newLixFile({
			keyValues: [
				{
					key: "lix_telemetry",
					value: args?.settings?.telemetry ?? "on",
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		}),
	});

	initDb(lix);

	try {
		await lix.db
			.insertInto("stored_schema_all")
			.values([
				{ value: InlangBundleSchema, lixcol_version_id: "global" },
				{ value: InlangMessageSchema, lixcol_version_id: "global" },
				{ value: InlangVariantSchema, lixcol_version_id: "global" },
			])
			.execute();

		const { value: lixId } = await lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_id")
			.executeTakeFirstOrThrow();

		// write files to lix
		await lix.db
			.insertInto("file")
			.values([
				{
					path: "/settings.json",
					data: new TextEncoder().encode(
						JSON.stringify(
							args?.settings ?? defaultProjectSettings,
							undefined,
							2
						)
					),
				},
				{
					path: "/project_id",
					data: new TextEncoder().encode(lixId),
				},
			])
			.execute();
		const blob = await lix.toBlob();
		await lix.close();
		return blob;
	} catch (e) {
		const error = new Error(`Failed to create new inlang project: ${e}`, {
			cause: e,
		});
		throw error;
	} finally {
		lix.close();
	}
}

export const defaultProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	baseLocale: "en",
	locales: ["en"],
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
