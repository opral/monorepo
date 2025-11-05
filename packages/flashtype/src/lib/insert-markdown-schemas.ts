import type { Lix } from "@lix-js/sdk";
import { AstSchemas } from "@opral/markdown-wc";

type MarkdownSchemaDefinition = (typeof AstSchemas.allSchemas)[number];

/**
 * Ensures all Markdown WC schema definitions are stored in the current Lix.
 *
 * Seeds `stored_schema_by_version` with any schema definitions that are not
 * already present for the `global` version. Existing definitions are left
 * untouched, allowing schema upgrades to append newer versions safely.
 *
 * @param lix - Active Lix instance to seed.
 *
 * @example
 * ```ts
 * await insertMarkdownSchemas({ lix });
 * ```
 */
export async function insertMarkdownSchemas(args: { lix: Lix }): Promise<void> {
	const { lix } = args;

	const rows = (await lix.db
		.selectFrom("stored_schema_by_version")
		.select(["value"])
		.where("lixcol_version_id", "=", "global")
		.execute()) as Array<{ value: unknown }>;

	const existing = new Set<string>();
	for (const row of rows) {
		const raw = row.value;
		const parsed =
			typeof raw === "string"
				? (JSON.parse(raw) as Record<string, unknown>)
				: ((raw as Record<string, unknown>) ?? null);
		const schemaKey = parsed?.["x-lix-key"];
		const schemaVersion = parsed?.["x-lix-version"];
		if (typeof schemaKey === "string" && typeof schemaVersion === "string") {
			existing.add(`${schemaKey}:${schemaVersion}`);
		}
	}

	const inserts: Array<{
		value: MarkdownSchemaDefinition;
		lixcol_version_id: "global";
	}> = [];

	for (const schema of AstSchemas.allSchemas as MarkdownSchemaDefinition[]) {
		const schemaKey = schema["x-lix-key"];
		const schemaVersion = schema["x-lix-version"];
		if (typeof schemaKey !== "string" || typeof schemaVersion !== "string") {
			continue;
		}
		const fingerprint = `${schemaKey}:${schemaVersion}`;
		if (existing.has(fingerprint)) continue;
		existing.add(fingerprint);
		inserts.push({
			value: schema,
			lixcol_version_id: "global",
		});
	}

	if (inserts.length === 0) return;

	await lix.db.insertInto("stored_schema_by_version").values(inserts).execute();
}
