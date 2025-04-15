import { test, expect } from "vitest";
import type { LixDatabaseSchema } from "../database/schema.js";
import {
	changeControlledTableIds,
	entityIdForRow,
	primaryKeysForEntityId,
	type PragmaTableInfo,
} from "./change-controlled-tables.js";
import { loadDatabaseInMemory } from "sqlite-wasm-kysely";
import { newLixFile } from "../lix/new-lix.js";

test("roundtrip entity_id test for single primary key", () => {
	const tableName: keyof LixDatabaseSchema = "key_value";
	const row = ["lix_mock_key", "value1"];

	const entityId = entityIdForRow(tableName, ...row);
	const primaryKeys = primaryKeysForEntityId(tableName, entityId);

	expect(entityId).toBe("lix_mock_key");
	expect(primaryKeys).toEqual([["key", "lix_mock_key"]]);
});

test("roundtrip entity_id test for compound primary keys", () => {
	const tableName: keyof LixDatabaseSchema = "change_set_label";

	const row = ["294u-2345", "0128-34928"];

	const entityId = entityIdForRow(tableName, ...row);
	const primaryKeys = primaryKeysForEntityId(tableName, entityId);

	expect(entityId).toBe("294u-2345,0128-34928");
	expect(primaryKeys).toEqual([
		["label_id", "294u-2345"],
		["change_set_id", "0128-34928"],
	]);
});

// otherwise the change controlled entity_id will be wrong.
//* if this tests fails, someone did a db schema change
//* on the primary key order that should not have been done.
test("the primary key order matches the order the primary keys in the database schema", async () => {
	const sqlite = await loadDatabaseInMemory(
		await (await newLixFile()).arrayBuffer()
	);

	const tableInfos: Record<string, PragmaTableInfo> = {};

	for (const table of Object.keys(changeControlledTableIds)) {
		tableInfos[table] = sqlite.exec({
			sql: `PRAGMA table_info(${table});`,
			returnValue: "resultRows",
			rowMode: "object",
		}) as PragmaTableInfo;
	}

	for (const table of Object.keys(changeControlledTableIds)) {
		const tableInfo = tableInfos[table]!;

		const primaryKeys = tableInfo
			.filter((column) => column.pk)
			.sort((a, b) => a.pk - b.pk)
			.map((c) => c.name);

		expect(primaryKeys).toEqual(
			// @ts-expect-error - some type narrowing problem. not important
			changeControlledTableIds[table]
		);
	}
});
