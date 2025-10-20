import { bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { validateStateMutation } from "./validate-state-mutation.js";
import { updateStateCacheV2 } from "../cache-v2/update-state-cache.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import type { LixChangeRaw } from "../../change/schema-definition.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";

async function insertStateAllRows(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	changes: readonly LixChangeRaw[];
	versionId: string;
}): Promise<void> {
	const rows = args.changes
		.filter((change) => typeof change.snapshot_content === "string")
		.map((change) => ({
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
			version_id: args.versionId,
			plugin_key: change.plugin_key,
			snapshot_content: JSON.parse(change.snapshot_content as string),
			schema_version: change.schema_version,
			created_at: change.created_at,
			updated_at: change.created_at,
			change_id: change.id,
			commit_id: change.id,
			inherited_from_version_id: null,
		}));
	if (rows.length === 0) {
		return;
	}
	await args.lix.db
		.insertInto("state_all")
		.values(rows as any)
		.execute();
}

const VERSION_ID = "global";
const FILE_ID = "bench_file";
const PLUGIN_KEY = "bench_plugin";
const ROW_COUNT = 1000;
const FK_ROW_COUNT = 1;

const PK_SCHEMA: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		code: { type: "string" },
	},
	required: ["id", "code"],
	"x-lix-key": "text_bench_pk",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/code"],
};

const UNIQUE_SCHEMA: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		details: {
			type: "object",
			additionalProperties: false,
			properties: {
				slug: { type: "string" },
			},
			required: ["slug"],
		},
	},
	required: ["id", "name", "details"],
	"x-lix-key": "text_bench_unique",
	"x-lix-version": "1.0",
	"x-lix-unique": [["/details/slug"]],
};

const FK_TARGET_SCHEMA: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		label: { type: "string" },
	},
	required: ["id"],
	"x-lix-key": "text_bench_fk_target",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
};

const FK_SOURCE_SCHEMA: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		target_id: { type: "string" },
		payload: { type: "string" },
	},
	required: ["id", "target_id"],
	"x-lix-key": "text_bench_fk_source",
	"x-lix-version": "1.0",
	"x-lix-foreign-keys": [
		{
			properties: ["/target_id"],
			references: {
				schemaKey: FK_TARGET_SCHEMA["x-lix-key"],
				properties: ["/id"],
			},
		},
	],
};

async function registerSchemas(
	lix: Awaited<ReturnType<typeof openLix>>,
	...schemas: readonly LixSchemaDefinition[]
): Promise<void> {
	for (const schema of schemas) {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.onConflict((oc) => oc.doNothing())
			.execute();
	}
}

function createChanges(args: {
	count: number;
	schemaKey: string;
	snapshotFactory: (idx: number) => Record<string, unknown>;
	timestamp: string;
	entityIdFactory?: (idx: number) => string;
}): LixChangeRaw[] {
	const changes: LixChangeRaw[] = [];
	for (let i = 0; i < args.count; i++) {
		changes.push({
			id: `change-${args.schemaKey}-${i}`,
			entity_id: args.entityIdFactory?.(i) ?? `${args.schemaKey}-entity-${i}`,
			schema_key: args.schemaKey,
			schema_version: "1.0",
			file_id: FILE_ID,
			plugin_key: PLUGIN_KEY,
			snapshot_content: JSON.stringify(args.snapshotFactory(i)),
			created_at: args.timestamp,
		});
	}
	return changes;
}

describe("validateStateMutation index benchmarks", () => {
	bench("primary key constraint with 5k cached rows", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});
		try {
			await registerSchemas(lix, PK_SCHEMA);
			const ts = await getTimestamp({ lix });

			const seedChanges = createChanges({
				count: ROW_COUNT,
				schemaKey: PK_SCHEMA["x-lix-key"],
				timestamp: ts,
				snapshotFactory: (idx) => ({
					id: `${PK_SCHEMA["x-lix-key"]}-entity-${idx}`,
					code: `code-${idx}`,
				}),
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes: seedChanges,
				version_id: VERSION_ID,
				commit_id: "seed-pk",
			});

			validateStateMutation({
				engine: lix.engine!,
				schema: PK_SCHEMA,
				schemaKey: PK_SCHEMA["x-lix-key"],
				snapshot_content: {
					id: `${PK_SCHEMA["x-lix-key"]}-entity-new`,
					code: "code-new",
				},
				entity_id: `${PK_SCHEMA["x-lix-key"]}-entity-new`,
				version_id: VERSION_ID,
				operation: "insert",
			});
		} catch (error) {
			console.error(
				"[validate-state-mutation.bench] primary key constraint with 5k cached rows failed",
				error
			);
			throw error;
		} finally {
			await lix.close();
		}
	});

	bench("unique constraint with nested JSON pointer (1k rows)", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});
		try {
			await registerSchemas(lix, UNIQUE_SCHEMA);
			const ts = await getTimestamp({ lix });

			const seedChanges = createChanges({
				count: ROW_COUNT,
				schemaKey: UNIQUE_SCHEMA["x-lix-key"],
				timestamp: ts,
				snapshotFactory: (idx) => ({
					id: `${UNIQUE_SCHEMA["x-lix-key"]}-entity-${idx}`,
					name: `entity-${idx}`,
					details: { slug: `slug-${idx}` },
				}),
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes: seedChanges,
				version_id: VERSION_ID,
				commit_id: "seed-unique",
			});

			validateStateMutation({
				engine: lix.engine!,
				schema: UNIQUE_SCHEMA,
				schemaKey: UNIQUE_SCHEMA["x-lix-key"],
				snapshot_content: {
					id: `${UNIQUE_SCHEMA["x-lix-key"]}-entity-new`,
					name: "entity-new",
					details: { slug: "slug-new" },
				},
				entity_id: `${UNIQUE_SCHEMA["x-lix-key"]}-entity-new`,
				version_id: VERSION_ID,
				operation: "insert",
			});
		} catch (error) {
			console.error(
				"[validate-state-mutation.bench] unique constraint with nested JSON pointer (1k rows) failed",
				error
			);
			throw error;
		} finally {
			await lix.close();
		}
	});

	bench("foreign key validation against 5k referenced rows", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});
		try {
			await registerSchemas(lix, FK_TARGET_SCHEMA, FK_SOURCE_SCHEMA);
			const ts = await getTimestamp({ lix });

			const targetChanges = createChanges({
				count: FK_ROW_COUNT,
				schemaKey: FK_TARGET_SCHEMA["x-lix-key"],
				timestamp: ts,
				snapshotFactory: (idx) => ({
					id: `target-${idx}`,
					label: `Target ${idx}`,
				}),
				entityIdFactory: (idx) => `target-${idx}`,
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes: targetChanges,
				version_id: VERSION_ID,
				commit_id: "seed-target",
			});
			await insertStateAllRows({
				lix,
				changes: targetChanges,
				versionId: VERSION_ID,
			});

			const sourceChanges = createChanges({
				count: FK_ROW_COUNT,
				schemaKey: FK_SOURCE_SCHEMA["x-lix-key"],
				timestamp: ts,
				snapshotFactory: (idx) => ({
					id: `source-${idx}`,
					target_id: `target-${idx}`,
					payload: `payload-${idx}`,
				}),
				entityIdFactory: (idx) => `source-${idx}`,
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes: sourceChanges,
				version_id: VERSION_ID,
				commit_id: "seed-source",
			});
			await insertStateAllRows({
				lix,
				changes: sourceChanges,
				versionId: VERSION_ID,
			});

			validateStateMutation({
				engine: lix.engine!,
				schema: FK_SOURCE_SCHEMA,
				schemaKey: FK_SOURCE_SCHEMA["x-lix-key"],
				snapshot_content: {
					id: "source-new",
					target_id: "target-0",
					payload: "payload-new",
				},
				entity_id: "source-new",
				version_id: VERSION_ID,
				operation: "insert",
			});
		} catch (error) {
			console.error(
				"[validate-state-mutation.bench] foreign key validation against 5k referenced rows failed",
				error
			);
			throw error;
		} finally {
			await lix.close();
		}
	});
});
