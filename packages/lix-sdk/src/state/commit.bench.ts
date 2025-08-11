import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { commit } from "./commit.js";
import { insertTransactionState } from "./insert-transaction-state.js";

// NOTE: openLix includes database initialization overhead
// This affects all benchmarks equally and represents real-world usage patterns
// this test exists to act as baseline for commit performance
bench("commit empty transaction (baseline)", async () => {
	const lix = await openLix({});

	commit({
		lix: lix as any,
	});
});

bench("commit transaction with 100 rows", async () => {
	const lix = await openLix({});

	// Insert multiple transaction states in a single batch
	const multipleData = [];
	for (let i = 0; i < 100; i++) {
		multipleData.push({
			entity_id: `commit_test_entity_${i}`,
			version_id: "global",
			schema_key: "commit_benchmark_entity",
			file_id: `commit_file`,
			plugin_key: "benchmark_plugin",
			snapshot_content: JSON.stringify({
				id: `commit_test_entity_${i}`,
				value: `test_data_${i}`,
				metadata: { type: "commit_benchmark", index: i },
			}),
			schema_version: "1.0",
			untracked: false,
		});
	}
	insertTransactionState({
		lix: lix as any,
		data: multipleData,
	});

	// Benchmark: Commit all transaction states
	commit({
		lix: { sqlite: lix.sqlite, db: lix.db as any, hooks: lix.hooks },
	});
});

bench.todo("commit with mixed operations (insert/update/delete)");
