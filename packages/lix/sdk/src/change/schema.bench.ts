import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { uuidV7 } from "../engine/functions/uuid-v7.js";
import { getTimestamp } from "../engine/functions/timestamp.js";

const ROW_NUM = 1000;
// Safe batch size to avoid SQLite variable limit
const BATCH_SIZE = 1000;

bench(`insert ${ROW_NUM} changes with snapshots`, async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const time = await getTimestamp({ lix });

	// Process in batches to avoid SQLite variable limit
	for (let batch = 0; batch < ROW_NUM; batch += BATCH_SIZE) {
		const batchSize = Math.min(BATCH_SIZE, ROW_NUM - batch);
		const snapshots = [];
		const changes = [];

		for (let i = batch; i < batch + batchSize; i++) {
			const snapshotId = await uuidV7({ lix });
			const snapshotContent = {
				entity_id: `entity-${i}`,
				schema_key: "test_entity",
				file_id: "test_file",
				data: {
					value: `test-value-${i}`,
					index: i,
					nested: {
						field1: `field1-${i}`,
						field2: i * 2,
						field3: i % 2 === 0,
					},
				},
			};

			snapshots.push({
				id: snapshotId,
				content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
			});

			changes.push({
				id: await uuidV7({ lix }),
				entity_id: `entity-${i}`,
				schema_key: "test_entity",
				schema_version: "1.0",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_id: snapshotId,
				created_at: time,
			});
		}

		// Insert snapshots first
		await db
			.insertInto("lix_internal_snapshot")
			.values(snapshots as any)
			.execute();

		// Then insert changes
		await db
			.insertInto("lix_internal_change")
			.values(changes as any)
			.execute();
	}
});

bench(
	`select ${ROW_NUM} changes from change view (with snapshot join)`,
	async () => {
		const lix = await openLix({});
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		const time = await getTimestamp({ lix });

		// First, insert test data in batches
		for (let batch = 0; batch < ROW_NUM; batch += BATCH_SIZE) {
			const batchSize = Math.min(BATCH_SIZE, ROW_NUM - batch);
			const snapshots = [];
			const changes = [];

			for (let i = batch; i < batch + batchSize; i++) {
				const snapshotId = await uuidV7({ lix });
				const snapshotContent = {
					entity_id: `entity-${i}`,
					schema_key: "test_entity",
					file_id: "test_file",
					data: {
						value: `test-value-${i}`,
						index: i,
						nested: {
							field1: `field1-${i}`,
							field2: i * 2,
							field3: i % 2 === 0,
						},
					},
				};

				snapshots.push({
					id: snapshotId,
					content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
				});

				changes.push({
					id: await uuidV7({ lix }),
					entity_id: `entity-${i}`,
					schema_key: "test_entity",
					schema_version: "1.0",
					file_id: "test_file",
					plugin_key: "test_plugin",
					snapshot_id: snapshotId,
					created_at: time,
				});
			}

			await db
				.insertInto("lix_internal_snapshot")
				.values(snapshots as any)
				.execute();

			await db
				.insertInto("lix_internal_change")
				.values(changes as any)
				.execute();
		}

		// Now benchmark selecting from the change view
		await lix.db.selectFrom("change").selectAll().execute();
	}
);

bench(`select single change by id from change view`, async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const time = await getTimestamp({ lix });

	// Insert a single test change
	const snapshotId = await uuidV7({ lix });
	const changeId = await uuidV7({ lix });

	await db
		.insertInto("lix_internal_snapshot")
		.values({
			id: snapshotId,
			content: sql`jsonb(${JSON.stringify({
				entity_id: "single-entity",
				data: { value: "test" },
			})})`,
		})
		.execute();

	await db
		.insertInto("lix_internal_change")
		.values({
			id: changeId,
			entity_id: "single-entity",
			schema_key: "test_entity",
			schema_version: "1.0",
			file_id: "test_file",
			plugin_key: "test_plugin",
			snapshot_id: snapshotId,
			created_at: time,
		})
		.execute();

	// Benchmark selecting a single change by ID
	await lix.db
		.selectFrom("change")
		.where("id", "=", changeId)
		.selectAll()
		.execute();
});

bench(`select changes with filtering by schema_key`, async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const time = await getTimestamp({ lix });

	// Insert test data with different schema keys in batches
	for (let batch = 0; batch < ROW_NUM; batch += BATCH_SIZE) {
		const batchSize = Math.min(BATCH_SIZE, ROW_NUM - batch);
		const snapshots = [];
		const changes = [];

		for (let i = batch; i < batch + batchSize; i++) {
			const snapshotId = await uuidV7({ lix });
			const schemaKey =
				i % 3 === 0
					? "test_entity_a"
					: i % 3 === 1
						? "test_entity_b"
						: "test_entity_c";

			snapshots.push({
				id: snapshotId,
				content: sql`jsonb(${JSON.stringify({
					entity_id: `entity-${i}`,
					data: { value: `test-${i}` },
				})})`,
			});

			changes.push({
				id: await uuidV7({ lix }),
				entity_id: `entity-${i}`,
				schema_key: schemaKey,
				schema_version: "1.0",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_id: snapshotId,
				created_at: time,
			});
		}

		await db
			.insertInto("lix_internal_snapshot")
			.values(snapshots as any)
			.execute();

		await db
			.insertInto("lix_internal_change")
			.values(changes as any)
			.execute();
	}

	// Benchmark selecting changes filtered by schema_key
	await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "test_entity_a")
		.selectAll()
		.execute();
});

bench(`compare: direct query vs change view`, async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const time = await getTimestamp({ lix });

	// Insert test data
	const snapshotId = await uuidV7({ lix });
	const changeId = await uuidV7({ lix });

	await db
		.insertInto("lix_internal_snapshot")
		.values({
			id: snapshotId,
			content: sql`jsonb(${JSON.stringify({
				entity_id: "test-entity",
				data: { value: "test" },
			})})`,
		})
		.execute();

	await db
		.insertInto("lix_internal_change")
		.values({
			id: changeId,
			entity_id: "test-entity",
			schema_key: "test_entity",
			schema_version: "1.0",
			file_id: "test_file",
			plugin_key: "test_plugin",
			snapshot_id: snapshotId,
			created_at: time,
		})
		.execute();

	await db
		.selectFrom("lix_internal_change as c")
		.innerJoin("lix_internal_snapshot as s", "s.id", "c.snapshot_id")
		.select([
			"c.id",
			"c.entity_id",
			"c.schema_key",
			"c.schema_version",
			"c.file_id",
			"c.plugin_key",
			"c.created_at",
			sql`json(s.content)`.as("snapshot_content"),
		])
		.where("c.id", "=", changeId)
		.execute();

	await lix.db
		.selectFrom("change")
		.where("id", "=", changeId)
		.selectAll()
		.execute();
});

bench(`select changes with NULL snapshots (deletions)`, async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const time = await getTimestamp({ lix });

	// Insert changes with no-content snapshot (deletions) in batches
	const totalDeletions = Math.floor(ROW_NUM / 10);
	for (let batch = 0; batch < totalDeletions; batch += BATCH_SIZE) {
		const batchSize = Math.min(BATCH_SIZE, totalDeletions - batch);
		const changes = [];

		for (let i = batch; i < batch + batchSize; i++) {
			changes.push({
				id: await uuidV7({ lix }),
				entity_id: `deleted-entity-${i}`,
				schema_key: "test_entity",
				schema_version: "1.0",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_id: "no-content",
				created_at: time,
			});
		}

		await db
			.insertInto("lix_internal_change")
			.values(changes as any)
			.execute();
	}

	// Benchmark selecting deletion changes
	await lix.db
		.selectFrom("change")
		.where("snapshot_content", "is", null)
		.selectAll()
		.execute();
});
