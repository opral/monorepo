import { test, expect } from "vitest";
import type { LixDatabaseSchema } from "../database/schema.js";
import {
	entityIdForRow,
	primaryKeysForEntityId,
} from "./change-controlled-tables.js";

test("roundtrip entity_id test for single primary key", () => {
	const tableName: keyof LixDatabaseSchema = "key_value";
	const row = ["lix_mock_key", "value1"];

	const entityId = entityIdForRow(tableName, ...row);
	const primaryKeys = primaryKeysForEntityId(tableName, entityId);

	expect(entityId).toBe("lix_mock_key");
	expect(primaryKeys).toEqual([["key", "lix_mock_key"]]);
});

test("roundtrip entity_id test for compound primary keys", () => {
	const tableName: keyof LixDatabaseSchema = "change_author";

	const row = ["294u-2345", "0128-34928"];

	const entityId = entityIdForRow(tableName, ...row);
	const primaryKeys = primaryKeysForEntityId(tableName, entityId);

	expect(entityId).toBe("294u-2345,0128-34928");
	expect(primaryKeys).toEqual([
		["change_id", "294u-2345"],
		["account_id", "0128-34928"],
	]);
});
