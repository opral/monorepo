import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";

const UPDATE_SCHEMA = {
	"x-lix-key": "update_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id"],
	additionalProperties: false,
} as const;

const EXPRESSION_SCHEMA = {
	"x-lix-key": "expression_update_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string" },
		value: { type: "object" },
	},
	required: ["id", "value"],
	additionalProperties: false,
} as const;

const IMMUTABLE_SCHEMA = {
	"x-lix-key": "immutable_update_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	"x-lix-immutable": true,
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id"],
	additionalProperties: false,
} as const;

test("rewrites updates for stored schema views", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: UPDATE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO update_schema (id, name) VALUES (?, ?)",
			parameters: ["row-1", "Original"],
		});

		lix.engine!.executeSync({
			sql: insertResult.sql,
			parameters: insertResult.parameters,
		});

		const updateResult = preprocess({
			sql: "UPDATE update_schema SET name = ? WHERE id = ?",
			parameters: ["Updated", "row-1"],
		});

		expect(updateResult.sql).toContain("UPDATE state_all");
		expect(updateResult.sql).toContain(
			"json_extract(snapshot_content, '$.id') = ?"
		);
		expect(updateResult.parameters).toEqual([
			"update_schema",
			"lix_own_entity",
			"Updated",
			"1.0",
			"row-1",
			"update_schema",
		]);

		const execResult = lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters,
		});
		// eslint-disable-next-line no-console
		console.log(execResult);

		const selectResult = preprocess({
			sql: "SELECT name FROM update_schema WHERE id = ?",
			parameters: ["row-1"],
		});

		const rows = lix.engine!.executeSync({
			sql: selectResult.sql,
			parameters: selectResult.parameters,
		}).rows;

		expect(rows).toEqual([
			{
				name: "Updated",
			},
		]);
	} finally {
		await lix.close();
	}
});

test("prefixless alias updates target stored schema key", async () => {
	const lix = await openLix({});
	try {
		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
			parameters: ["alias", { foo: "bar" }],
		});

		lix.engine!.executeSync({
			sql: insertResult.sql,
			parameters: insertResult.parameters as any[],
		});

		const updateResult = preprocess({
			sql: "UPDATE key_value SET value = json_set(value, '$.foo', ?) WHERE key = ?",
			parameters: ["baz", "alias"],
		});

		expect(updateResult.parameters[0]).toBe("lix_key_value");
		expect(updateResult.sql).toContain("UPDATE state_all");

		lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters as any[],
		});

		const selectResult = preprocess({
			sql: "SELECT value FROM key_value WHERE key = ?",
			parameters: ["alias"],
		});

		const rows = lix.engine!.executeSync({
			sql: selectResult.sql,
			parameters: selectResult.parameters as any[],
		}).rows;

		expect(rows).toHaveLength(1);
		const parsed = (() => {
			const raw = rows[0]?.value;
			if (typeof raw === "string") {
				return JSON.parse(raw);
			}
			return raw;
		})();
		expect(parsed).toEqual({ foo: "baz" });
	} finally {
		await lix.close();
	}
});

test("updates to immutable schemas are rejected", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: IMMUTABLE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO immutable_update_schema (id, name) VALUES (?, ?)",
			parameters: ["row-1", "first"],
		});

		lix.engine!.executeSync({
			sql: insertResult.sql,
			parameters: insertResult.parameters as any[],
		});

		const updateResult = preprocess({
			sql: "UPDATE immutable_update_schema SET name = ? WHERE id = ?",
			parameters: ["updated", "row-1"],
		});

		expect(() =>
			lix.engine!.executeSync({
				sql: updateResult.sql,
				parameters: updateResult.parameters as any[],
			})
		).toThrow(/immutable/i);
	} finally {
		await lix.close();
	}
});

test("active_version updates keep global routing version", async () => {
	const lix = await openLix({});
	try {
		const preprocess = await createQueryPreprocessor(lix.engine!);

		const before = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		const versions = await lix.db.selectFrom("version").select("id").execute();
		const targetVersionId =
			versions.find((row) => row.id !== before.version_id)?.id ??
			before.version_id;
		expect(targetVersionId).not.toBe(before.version_id);

		const updateResult = preprocess({
			sql: "UPDATE active_version SET version_id = ?",
			parameters: [targetVersionId],
		});

		expect(updateResult.parameters).toContain("global");
		expect(updateResult.parameters).toContain("active");

		lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters,
		});

		const after = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		expect(after.version_id).not.toBe(before.version_id);
		expect(after.version_id).toBe(targetVersionId);
	} finally {
		await lix.close();
	}
});

test("rewrites updates for _all views", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: UPDATE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		const insertResult = preprocess({
			sql: "INSERT INTO update_schema_all (id, name, lixcol_version_id) VALUES (?, ?, ?)",
			parameters: ["row-2", "Original All", activeVersion.version_id],
		});

		lix.engine!.executeSync({
			sql: insertResult.sql,
			parameters: insertResult.parameters,
		});

		const updateResult = preprocess({
			sql: "UPDATE update_schema_all SET name = ? WHERE id = ? AND lixcol_version_id = ?",
			parameters: ["Updated All", "row-2", activeVersion.version_id],
		});

		expect(updateResult.sql).toContain("UPDATE state_all");
		expect(updateResult.parameters).toEqual([
			"update_schema",
			"lix_own_entity",
			"Updated All",
			"1.0",
			"row-2",
			activeVersion.version_id,
			"update_schema",
		]);

		lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters,
		});

		const selectResult = preprocess({
			sql: "SELECT name FROM update_schema_all WHERE id = ? AND lixcol_version_id = ?",
			parameters: ["row-2", activeVersion.version_id],
		});

		const rows = lix.engine!.executeSync({
			sql: selectResult.sql,
			parameters: selectResult.parameters,
		}).rows;

		expect(rows).toEqual([
			{
				name: "Updated All",
			},
		]);
	} finally {
		await lix.close();
	}
});

test("rewrites updates with JSON payloads", async () => {
	const lix = await openLix({});
	try {
		const schema = {
			"x-lix-key": "json_update_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			"x-lix-defaults": {
				lixcol_file_id: "lix",
				lixcol_plugin_key: "lix_own_entity",
			},
			type: "object",
			properties: {
				id: { type: "string" },
				payload: { type: "object" },
			},
			required: ["id", "payload"],
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO json_update_schema (id, payload) VALUES (?, ?)",
			parameters: ["row-1", { foo: "bar" }],
		});

		lix.engine!.executeSync({
			sql: insertResult.sql,
			parameters: insertResult.parameters,
		});

		const updateResult = preprocess({
			sql: "UPDATE json_update_schema SET payload = ? WHERE id = ?",
			parameters: [{ items: ["foo", "bar"] }, "row-1"],
		});

		expect(updateResult.parameters).toContain('{"items":["foo","bar"]}');

		lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters,
		});

		const selectResult = preprocess({
			sql: "SELECT payload FROM json_update_schema_all WHERE id = ?",
			parameters: ["row-1"],
		});

		const rows = lix.engine!.executeSync({
			sql: selectResult.sql,
			parameters: selectResult.parameters,
		}).rows;

		expect(rows).toEqual([{ payload: '{"items":["foo","bar"]}' }]);

		const stateRows = await lix.db
			.selectFrom("state_all")
			.select(["snapshot_content"] as const)
			.where("schema_key", "=", "json_update_schema")
			.execute();

		expect(stateRows.map((row) => row.snapshot_content)).toEqual([
			{ id: "row-1", payload: { items: ["foo", "bar"] } },
		]);
	} finally {
		await lix.close();
	}
});

test("rewrites updates that use SQL expressions referencing entity properties", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: EXPRESSION_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO expression_update_schema (id, value) VALUES (?, ?)",
			parameters: ["row-1", { theme: "light", counter: 1 }],
		});

		lix.engine!.executeSync({
			sql: insertResult.sql,
			parameters: insertResult.parameters,
		});

		const updateResult = preprocess({
			sql: "UPDATE expression_update_schema SET value = json_set(value, '$.counter', json_extract(value, '$.counter') + 1, '$.theme', ?) WHERE id = ?",
			parameters: ["dark", "row-1"],
		});

		expect(updateResult.sql).toContain("json_set");
		expect(updateResult.sql).toContain(
			"json_extract(snapshot_content, '$.value')"
		);

		lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters,
		});

		const selectResult = preprocess({
			sql: "SELECT value FROM expression_update_schema WHERE id = ?",
			parameters: ["row-1"],
		});

		const rows = lix.engine!.executeSync({
			sql: selectResult.sql,
			parameters: selectResult.parameters,
		}).rows as Array<{ value: string }>;

		const parsed = rows?.[0]?.value ? JSON.parse(rows[0].value) : null;
		expect(parsed).toEqual({ counter: 2, theme: "dark" });

		const stateRows = await lix.db
			.selectFrom("state_all")
			.select(["snapshot_content"] as const)
			.where("schema_key", "=", "expression_update_schema")
			.execute();

		expect(stateRows).toEqual([
			{
				snapshot_content: {
					id: "row-1",
					value: { counter: 2, theme: "dark" },
				},
			},
		]);
	} finally {
		await lix.close();
	}
});
