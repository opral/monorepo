import { expect, test } from "vitest";
import { openLix } from "../../lix/index.js";
import { createPreprocessor } from "./create-preprocessor.js";
import { schemaKeyToCacheTableName } from "../../state/cache/create-schema-cache-table.js";

test("reuses memoised context between runs", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const sql = `
		SELECT *
		FROM lix_internal_state_vtable
	`;

	const first = preprocess({ sql, parameters: [] });
	const second = preprocess({ sql, parameters: [] });

	expect(first.context).toBeDefined();
	expect(second.context?.storedSchemas).toBe(first.context?.storedSchemas);
	expect(second.context?.cacheTables).toBe(first.context?.cacheTables);

	await lix.close();
});

test("refreshes context after schema mutations", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const sql = `
		SELECT *
		FROM lix_internal_state_vtable
	`;

	const initial = preprocess({ sql, parameters: [] }).context!;
	const descriptorTable = schemaKeyToCacheTableName("lix_version_descriptor");
	expect(initial.cacheTables.get("lix_version_descriptor")).toBe(
		descriptorTable
	);

	const newSchema = {
		"x-lix-key": "test_custom_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: { id: { type: "string" } },
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: newSchema as any })
		.execute();

	const refreshed = preprocess({ sql, parameters: [] }).context!;
	expect(refreshed.storedSchemas).not.toBe(initial.storedSchemas);
	expect(refreshed.storedSchemas.get("test_custom_schema")).toEqual(newSchema);

	await lix.close();
});

test("collects trace entries when enabled", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const sql = `
		SELECT *
		FROM lix_internal_state_vtable
	`;

	const traced = preprocess({ sql, parameters: [], trace: true });
	expect(traced.context?.trace).toBeDefined();
	expect(traced.context?.trace?.length).toBeGreaterThan(0);

	const normal = preprocess({ sql, parameters: [] });
	expect(normal.context?.trace).toBeUndefined();

	await lix.close();
});
