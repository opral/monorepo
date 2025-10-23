import { promises as fs } from "fs";
import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { validateStateMutation } from "./validate-state-mutation.js";
import { updateStateCacheV2 } from "../cache-v2/update-state-cache.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import type { LixChangeRaw } from "../../change/schema-definition.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";

const OUTPUT_DIR = decodeURIComponent(
	new URL("./__playground__", import.meta.url).pathname
);

const VERSION_ID = "global";
const FILE_ID = "playground-file";
const PLUGIN_KEY = "playground-plugin";
const ROW_COUNT = 1_000;

const PK_SCHEMA: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		code: { type: "string" },
	},
	required: ["id", "code"],
	"x-lix-key": "text_play_pk",
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
	"x-lix-key": "text_play_unique",
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
	"x-lix-key": "text_play_fk_target",
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
	"x-lix-key": "text_play_fk_source",
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

type ChangeFactoryArgs = {
	count: number;
	schemaKey: string;
	snapshotFactory: (idx: number) => Record<string, unknown>;
	timestamp: string;
	entityIdFactory?: (idx: number) => string;
};

function createChanges(args: ChangeFactoryArgs): LixChangeRaw[] {
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
	if (rows.length === 0) return;
	for (const row of rows) {
		await args.lix.db
			.insertInto("state_all")
			.values(row as any)
			.execute();
	}
}

type CaptureOptions = {
	lix: Awaited<ReturnType<typeof openLix>>;
	label: string;
	run: () => Promise<void>;
	predicate: (entry: {
		sql: string;
		parameters: unknown[] | undefined;
	}) => boolean;
};

async function captureExplainPlan(options: CaptureOptions): Promise<void> {
	const { lix, label, run, predicate } = options;
	const engine = lix.engine!;
	const executed: { sql: string; parameters: unknown[] | undefined }[] = [];

	const original = engine.executeSync.bind(engine);
	engine.executeSync = (args: any) => {
		if (typeof args?.sql === "string") {
			const params = Array.isArray(args.parameters)
				? ([...args.parameters] as unknown[])
				: undefined;
			executed.push({
				sql: args.sql,
				parameters: params,
			});
		}
		return original(args);
	};

	try {
		await run();
	} finally {
		engine.executeSync = original;
	}

	const captured = executed.find((entry) => predicate(entry));
	if (!captured) {
		console.error(
			`[validate-state-mutation.playground] no match for ${label}. Captured queries:\n${executed
				.map((entry) => entry.sql)
				.join("\n\n")}`
		);
	}
	expect(captured, `No matching query captured for ${label}`).toBeTruthy();
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const explain = (await lix.call("lix_explain_query", {
		sql: captured!.sql,
		parameters: captured!.parameters ?? [],
	})) as {
		original: { sql: string };
		expanded?: { sql: string };
		rewritten?: { sql: string; parameters: unknown[] };
		plan: unknown;
	};

	const payload = [
		`-- SQL (${label})`,
		explain.original.sql,
		"",
		"-- expanded SQL",
		explain.expanded?.sql ?? "<unchanged>",
		"",
		"-- rewritten SQL",
		explain.rewritten?.sql ?? "<unchanged>",
		"",
		"-- rewritten parameters",
		JSON.stringify(explain.rewritten?.parameters ?? []),
		"",
		"-- query plan",
		JSON.stringify(explain.plan, null, 2),
		"",
	].join("\n");

	await fs.writeFile(
		`${OUTPUT_DIR}/validate-state-mutation.${label}.explain.txt`,
		payload
	);
}

test("validateStateMutation explain plans", async () => {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	// Primary key scenario
	{
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

			await captureExplainPlan({
				lix,
				label: "primary-key",
				predicate: ({ sql }) =>
					sql.includes("lix_internal_state_vtable") &&
					sql.includes("json_extract"),
				run: async () => {
					await validateStateMutation({
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
				},
			});
		} finally {
			await lix.close();
		}
	}

	// Unique constraint scenario
	{
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

			await captureExplainPlan({
				lix,
				label: "unique-nested",
				predicate: ({ sql }) =>
					sql.includes("lix_internal_state_vtable") &&
					sql.includes("json_extract") &&
					sql.includes("details"),
				run: async () => {
					await validateStateMutation({
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
				},
			});
		} finally {
			await lix.close();
		}
	}

	// Foreign key scenario
	{
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
				count: 1,
				schemaKey: FK_TARGET_SCHEMA["x-lix-key"],
				timestamp: ts,
				snapshotFactory: () => ({
					id: "target-0",
					label: "Target 0",
				}),
				entityIdFactory: () => "target-0",
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes: targetChanges,
				version_id: VERSION_ID,
				commit_id: "seed-fk-target",
			});
			await insertStateAllRows({
				lix,
				changes: targetChanges,
				versionId: VERSION_ID,
			});

			const sourceChanges = createChanges({
				count: 1,
				schemaKey: FK_SOURCE_SCHEMA["x-lix-key"],
				timestamp: ts,
				snapshotFactory: () => ({
					id: "source-0",
					target_id: "target-0",
					payload: "payload-0",
				}),
				entityIdFactory: () => "source-0",
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes: sourceChanges,
				version_id: VERSION_ID,
				commit_id: "seed-fk-source",
			});
			await insertStateAllRows({
				lix,
				changes: sourceChanges,
				versionId: VERSION_ID,
			});

			await captureExplainPlan({
				lix,
				label: "foreign-key",
				predicate: ({ sql, parameters }) => {
					const lower = sql.toLowerCase();
					const normalised = lower.replace(/\s+/g, " ");
					const [schemaParam] = parameters ?? [];
					return (
						normalised.includes(
							'select "snapshot_content" from "lix_internal_state_vtable" where'
						) &&
						normalised.includes("json_extract(snapshot_content, '$.id') = ?") &&
						normalised.includes('"inherited_from_version_id" is null') &&
						schemaParam === FK_TARGET_SCHEMA["x-lix-key"]
					);
				},
				run: async () => {
					await validateStateMutation({
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
				},
			});
		} finally {
			await lix.close();
		}
	}
});
