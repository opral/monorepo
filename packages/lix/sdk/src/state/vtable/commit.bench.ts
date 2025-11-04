import { bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { commit } from "./commit.js";
import { insertTransactionState } from "../transaction/insert-transaction-state.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

const COMMIT_BENCHMARK_SCHEMA: LixSchemaDefinition = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		value: { type: "string" },
		metadata: {
			type: "object",
			additionalProperties: false,
			properties: {
				type: { type: "string" },
				index: { type: "number" },
				txn: { type: "number" },
			},
		},
	},
	required: ["id", "value"],
	"x-lix-key": "commit_benchmark_entity",
	"x-lix-version": "1.0",
};

async function registerCommitSchema(
	lix: Awaited<ReturnType<typeof openLix>>
): Promise<void> {
	await lix.db
		.insertInto("stored_schema")
		.values({ value: COMMIT_BENCHMARK_SCHEMA })
		.execute();
}

describe("commit empty transaction (baseline)", async () => {
	const lix = await openLix({});
	await registerCommitSchema(lix);

	bench("", () => {
		commit({
			engine: lix.engine!,
		});
	});
});

describe("commit transaction with 1 row", async () => {
	const lix = await openLix({});
	await registerCommitSchema(lix);

	let seedIteration = 0;
	const seedSingleRow = async (): Promise<void> => {
		const iteration = seedIteration++;
		const rowId = `commit_test_entity_${iteration}`;

		insertTransactionState({
			engine: lix.engine!,
			data: [
				{
					entity_id: rowId,
					version_id: "global",
					schema_key: "commit_benchmark_entity",
					file_id: "commit_file",
					plugin_key: "benchmark_plugin",
					snapshot_content: JSON.stringify({
						id: rowId,
						value: `test_data_${iteration}`,
						metadata: { type: "commit_benchmark", index: iteration },
					}),
					schema_version: "1.0",
					untracked: false,
				},
			],
			timestamp: await getTimestamp({ lix }),
		});
	};

	bench("", () => {
		commit({
			engine: lix.engine!,
		});
	}, {
		setup: (task) => {
			task.opts.beforeEach = async () => {
				await seedSingleRow();
			};
		},
	});
});

describe("commit transaction with 100 rows", async () => {
	const lix = await openLix({});
	await registerCommitSchema(lix);

	const ROW_COUNT = 100;
	let seedIteration = 0;
	const seedHundredRows = async (): Promise<void> => {
		const iteration = seedIteration++;
		const offset = iteration * ROW_COUNT;
		const rows = [];

		for (let i = 0; i < ROW_COUNT; i++) {
			const globalIndex = offset + i;
			rows.push({
				entity_id: `commit_test_entity_${globalIndex}`,
				version_id: "global",
				schema_key: "commit_benchmark_entity",
				file_id: "commit_file",
				plugin_key: "benchmark_plugin",
				snapshot_content: JSON.stringify({
					id: `commit_test_entity_${globalIndex}`,
					value: `test_data_${globalIndex}`,
					metadata: {
						type: "commit_benchmark",
						index: globalIndex,
					},
				}),
				schema_version: "1.0",
				untracked: false,
			});
		}

		insertTransactionState({
			engine: lix.engine!,
			data: rows,
			timestamp: await getTimestamp({ lix }),
		});
	};

	bench("", () => {
		commit({
			engine: lix.engine!,
		});
	}, {
		setup: (task) => {
			task.opts.beforeEach = async () => {
				await seedHundredRows();
			};
		},
	});
});

describe("commit 10 transactions x 10 changes (sequential)", async () => {
	const lix = await openLix({});
	await registerCommitSchema(lix);

	const TXN_COUNT = 10;
	const ROWS_PER_TXN = 10;
	let seedIteration = 0;
	let preparedBatches: Array<{
		data: Parameters<typeof insertTransactionState>[0]["data"];
		timestamp: string;
	}> = [];

	const prepareSequentialBatches = async (): Promise<void> => {
		const iteration = seedIteration++;
		const baseOffset = iteration * TXN_COUNT * ROWS_PER_TXN;
		preparedBatches = [];

		for (let t = 0; t < TXN_COUNT; t++) {
			const batch = [];
			for (let i = 0; i < ROWS_PER_TXN; i++) {
				const globalIndex = baseOffset + t * ROWS_PER_TXN + i;
				batch.push({
					entity_id: `seq_commit_entity_${globalIndex}`,
					version_id: "global",
					schema_key: "commit_benchmark_entity",
					file_id: "commit_file",
					plugin_key: "benchmark_plugin",
					snapshot_content: JSON.stringify({
						id: `seq_commit_entity_${globalIndex}`,
						value: `seq_data_${globalIndex}`,
						metadata: {
							type: "commit_benchmark_seq",
							txn: t,
							index: i,
						},
					}),
					schema_version: "1.0",
					untracked: false,
				});
			}

			preparedBatches.push({
				data: batch,
				timestamp: await getTimestamp({ lix }),
			});
		}
	};

	bench("", () => {
		for (const batch of preparedBatches) {
			insertTransactionState({
				engine: lix.engine!,
				data: batch.data,
				timestamp: batch.timestamp,
			});
			commit({
				engine: lix.engine!,
			});
		}
	}, {
		setup: (task) => {
			task.opts.beforeEach = async () => {
				await prepareSequentialBatches();
			};
		},
	});
});

describe("commit with mixed operations (insert/update/delete)", async () => {
	const lix = await openLix({});
	await registerCommitSchema(lix);

	const BASE_COUNT = 30;
	const INSERTS = 10;
	const UPDATES = 10;
	const DELETES = 10;
	let seedIteration = 0;

	const prepareBaseline = async (iteration: number): Promise<void> => {
		const baseRows = [];
		for (let i = 0; i < BASE_COUNT; i++) {
			const id = `mixed_entity_${iteration}_${i}`;
			baseRows.push({
				entity_id: id,
				version_id: "global",
				schema_key: "commit_benchmark_entity",
				file_id: "commit_file",
				plugin_key: "benchmark_plugin",
				snapshot_content: JSON.stringify({
					id,
					value: `base_${iteration}_${i}`,
				}),
				schema_version: "1.0",
				untracked: false,
			});
		}

		insertTransactionState({
			engine: lix.engine!,
			data: baseRows,
			timestamp: await getTimestamp({ lix }),
		});

		commit({ engine: lix.engine! });
	};

	const seedMixedOperations = async (): Promise<void> => {
		const iteration = seedIteration++;
		await prepareBaseline(iteration);

		const ops = [];

		for (let i = 0; i < INSERTS; i++) {
			const id = `mixed_new_${iteration}_${i}`;
			ops.push({
				entity_id: id,
				version_id: "global",
				schema_key: "commit_benchmark_entity",
				file_id: "commit_file",
				plugin_key: "benchmark_plugin",
				snapshot_content: JSON.stringify({
					id,
					value: `insert_${iteration}_${i}`,
				}),
				schema_version: "1.0",
				untracked: false,
			});
		}

		for (let i = 0; i < UPDATES; i++) {
			const id = `mixed_entity_${iteration}_${i}`;
			ops.push({
				entity_id: id,
				version_id: "global",
				schema_key: "commit_benchmark_entity",
				file_id: "commit_file",
				plugin_key: "benchmark_plugin",
				snapshot_content: JSON.stringify({
					id,
					value: `updated_${iteration}_${i}`,
				}),
				schema_version: "1.0",
				untracked: false,
			});
		}

		for (let i = 0; i < DELETES; i++) {
			const id = `mixed_entity_${iteration}_${BASE_COUNT - 1 - i}`;
			ops.push({
				entity_id: id,
				version_id: "global",
				schema_key: "commit_benchmark_entity",
				file_id: "commit_file",
				plugin_key: "benchmark_plugin",
				snapshot_content: null,
				schema_version: "1.0",
				untracked: false,
			});
		}

		insertTransactionState({
			engine: lix.engine!,
			data: ops,
			timestamp: await getTimestamp({ lix }),
		});
	};

	bench("", () => {
		commit({
			engine: lix.engine!,
		});
	}, {
		setup: (task) => {
			task.opts.beforeEach = async () => {
				await seedMixedOperations();
			};
		},
	});
});
