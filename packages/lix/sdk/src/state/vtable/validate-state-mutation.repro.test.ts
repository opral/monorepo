import { promises as fs } from "fs";
import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCacheV2 } from "../cache-v2/update-state-cache.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import type { LixChangeRaw } from "../../change/schema-definition.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";

const OUTPUT_DIR = decodeURIComponent(
	new URL("./__repro__", import.meta.url).pathname
);

const VERSION_ID = "global";
const FILE_ID = "repro-file";
const PLUGIN_KEY = "repro-plugin";

const REPRO_SCHEMA: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		value: { type: "string" },
	},
	required: ["id", "value"],
	"x-lix-key": "validate_state_mutation_repro",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
};

test("validateStateMutation state_all placeholder rewrite reproduction", async () => {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: VERSION_ID,
			},
		],
	});

	try {
		await registerSchemas(lix, REPRO_SCHEMA);
		const timestamp = await getTimestamp({ lix });

		const changes = createChanges({
			count: 1,
			schemaKey: REPRO_SCHEMA["x-lix-key"],
			timestamp,
			snapshotFactory: () => ({
				id: "entity-0",
				value: "payload-0",
			}),
		});

		updateStateCacheV2({
			engine: lix.engine!,
			changes,
			version_id: VERSION_ID,
			commit_id: "repro-seed",
		});

		const sql = `select "snapshot_content" from "state_all" where "schema_key" = ?1 and json_extract(snapshot_content, '$.id') = ?2 and "version_id" = ?3 and "inherited_from_version_id" is null`;
		const parameters = [REPRO_SCHEMA["x-lix-key"], "entity-0", VERSION_ID];

		// Prime the rewrite with a real execution so schema-specific cache tables
		// are materialised before capturing the explain output.
		await lix.call("lix_execute_sync", { sql, parameters });

		const explain = (await lix.call("lix_explain_query", {
			sql,
			parameters,
		})) as {
			originalSql: string;
			rewrittenSql?: string;
			plan: unknown;
		};

		const output = [
			"-- SQL (state_all placeholder reproduction)",
			explain.originalSql,
			"",
			"-- rewritten SQL",
			explain.rewrittenSql ?? "<unchanged>",
			"",
			"-- rewritten parameters",
			JSON.stringify(parameters),
			"",
			"-- query plan",
			JSON.stringify(explain.plan, null, 2),
			"",
		].join("\n");

		await fs.writeFile(
			`${OUTPUT_DIR}/validate-state-mutation.state_all-placeholder.explain.txt`,
			output,
			"utf8"
		);

		expect(explain.rewrittenSql).toBeTruthy();
	} finally {
		await lix.close();
	}
});

test("state view rewrite reproduction", async () => {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: VERSION_ID,
			},
		],
	});

	try {
		await registerSchemas(lix, REPRO_SCHEMA);
		const timestamp = await getTimestamp({ lix });

		const changes = createChanges({
			count: 1,
			schemaKey: REPRO_SCHEMA["x-lix-key"],
			timestamp,
			snapshotFactory: () => ({
				id: `${REPRO_SCHEMA["x-lix-key"]}-entity-0`,
				value: "payload-0",
			}),
		});

		updateStateCacheV2({
			engine: lix.engine!,
			changes,
			version_id: VERSION_ID,
			commit_id: "state-repro",
		});

		const entityId = `${REPRO_SCHEMA["x-lix-key"]}-entity-0`;
		const sql = `select "entity_id", "schema_key", "writer_key" from "state" where "entity_id" = ?1 AND "schema_key" = ?2`;
		const parameters = [entityId, REPRO_SCHEMA["x-lix-key"]];

		const explain = (await lix.call("lix_explain_query", {
			sql,
			parameters,
		})) as {
			originalSql: string;
			rewrittenSql?: string;
			plan: unknown;
		};

		const output = [
			"-- SQL (state view reproduction)",
			explain.originalSql,
			"",
			"-- rewritten SQL",
			explain.rewrittenSql ?? "<unchanged>",
			"",
			"-- rewritten parameters",
			JSON.stringify(parameters),
			"",
			"-- query plan",
			JSON.stringify(explain.plan, null, 2),
			"",
		].join("\n");

		await fs.writeFile(
			`${OUTPUT_DIR}/state-view.rewrite.explain.txt`,
			output,
			"utf8"
		);
	} finally {
		await lix.close();
	}
});

async function registerSchemas(
	lix: Awaited<ReturnType<typeof openLix>>,
	...schemas: readonly LixSchemaDefinition[]
): Promise<void> {
	for (const schema of schemas) {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			// .onConflict((oc) => oc.doNothing())
			.execute();
	}
}

function createChanges(args: {
	count: number;
	schemaKey: string;
	timestamp: string;
	snapshotFactory: (idx: number) => Record<string, unknown>;
}): LixChangeRaw[] {
	const changes: LixChangeRaw[] = [];
	for (let i = 0; i < args.count; i++) {
		changes.push({
			id: `change-${args.schemaKey}-${i}`,
			entity_id: `${args.schemaKey}-entity-${i}`,
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
