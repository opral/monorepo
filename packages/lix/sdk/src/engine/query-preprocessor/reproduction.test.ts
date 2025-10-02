import { describe, expect, test } from "vitest";
import { openLix } from "../../lix/index.js";
import { createQueryPreprocessorV2 } from "./create-query-preprocessor-v2.js";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { sql } from "kysely";

describe("query preprocessor reproduction", () => {
	test("read stale cache flag query is rewritten", async () => {
		const lix = await openLix({});
		try {
			const preprocess = await createQueryPreprocessorV2(lix.engine!);

			const compiled = internalQueryBuilder
				.selectFrom("internal_state_vtable")
				.where("entity_id", "=", "lix_state_cache_stale")
				.where("schema_key", "=", "lix_key_value")
				.where("version_id", "=", "global")
				.where("snapshot_content", "is not", null)
				.select(
					sql`json_extract(snapshot_content, '$.value')`.as("value")
				)
				.compile();

			const result = preprocess({
				sql: compiled.sql,
				parameters: compiled.parameters as Readonly<unknown[]>,
			});

			expect(result.sql).not.toMatch(/FROM\s+internal_state_vtable\b/i);
		} finally {
			await lix.close();
		}
	});
});
