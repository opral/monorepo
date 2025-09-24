import { expect, test } from "vitest";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { openLix } from "../../../lix/index.js";
import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../../../key-value/schema-definition.js";
import { rewriteInternalStateReader } from "./internal-state-reader.js";
import { SqliteQueryCompiler } from "kysely";

const sqliteCompiler = new SqliteQueryCompiler();

test("reads untracked state", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	// insert untracked key value
	// TODO replace with internal_state_writer view later
	lix.engine!.executeQuerySync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "mock_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: true,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "mock_key",
					value: "mock_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "mock_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "version_id"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows: result } = lix.engine!.executeQuerySync(compiled);

	expect(result).toHaveLength(1);
	expect(result[0]).toMatchObject({
		untracked: 1,
		version_id: "global",
		snapshot_content: JSON.stringify({
			key: "mock_key",
			value: "mock_value",
		}),
	});
});

