import { sql, type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change } from "../change/schema.js";
import { nanoid } from "../database/nano-id.js";
import type { NewStateRow } from "./schema.js";
import {
	INITIAL_CHANGE_SET_ID,
	INITIAL_VERSION_ID,
	INITIAL_WORKING_CHANGE_SET_ID,
	type Version,
	type LixVersion,
	LixVersionSchema,
} from "../version/schema.js";
import {
	type LixChangeSet,
	type LixChangeSetEdge,
	type LixChangeSetElement,
	LixChangeSetSchema,
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
} from "../change-set-v2/schema.js";

export function handleStateMutation(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	entity_id: string,
	schema_key: string,
	file_id: string,
	plugin_key: string,
	snapshot_content: string, // stringified json
	version_id: string,
	schema_version: string
): 0 | 1 {
	const rootChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content,
			schema_version,
		},
	});

	// workaround to bootstrap the initial state
	// TODO implement skip_change_control flag which
	// the initial state can use.
	if (
		entity_id.includes(INITIAL_VERSION_ID) ||
		entity_id.includes(INITIAL_CHANGE_SET_ID) ||
		entity_id.includes(INITIAL_WORKING_CHANGE_SET_ID)
	) {
		return 0;
	}

	// Get the latest 'lix_version' entity's snapshot content using the activeVersionId
	const [versionRecord] = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("internal_change")
			.innerJoin(
				"internal_snapshot",
				"internal_change.snapshot_id",
				"internal_snapshot.id"
			)
			.where("internal_change.schema_key", "=", "lix_version")
			.where("internal_change.entity_id", "=", version_id)
			.where("internal_change.snapshot_id", "!=", "no-content")
			// @ts-expect-error - rowid is a valid SQLite column but not in Kysely types
			.orderBy("internal_change.rowid", "desc")
			.limit(1)
			.select(sql`json(internal_snapshot.content)`.as("content")),
	}) as [{ content: string } | undefined];

	if (!versionRecord) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	const version = JSON.parse(versionRecord.content) as Version;

	const changeSetId = nanoid();

	const changeSetChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: changeSetId,
			schema_key: "lix_change_set",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: changeSetId,
				metadata: null,
			} satisfies LixChangeSet),
			schema_version: LixChangeSetSchema["x-lix-version"],
		},
	});

	const changeSetEdgeChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: `${version.change_set_id}::${changeSetId}`,
			schema_key: "lix_change_set_edge",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: version.change_set_id,
				child_id: changeSetId,
			} satisfies LixChangeSetEdge),
			schema_version: LixChangeSetEdgeSchema["x-lix-version"],
		},
	});

	const versionChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: version.id,
			schema_key: "lix_version",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...version,
				change_set_id: changeSetId,
			} satisfies LixVersion),
			schema_version: LixVersionSchema["x-lix-version"],
		},
	});

	for (const change of [
		rootChange,
		changeSetChange,
		changeSetEdgeChange,
		versionChange,
	]) {
		const changeSetElementChange = createChangeWithSnapshot({
			sqlite,
			db,
			data: {
				entity_id: `${changeSetId}::${change.id}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: changeSetId,
					change_id: change.id,
					schema_key: change.schema_key,
					file_id: change.file_id,
					entity_id: change.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
			},
		});
		// TODO investigate if needed as part of a change set itself
		// seems to make queries slower
		// creating a change set element for the change set element change
		// this is meta but allows us to reconstruct and mutate a change set
		// createChangeWithSnapshot({
		// 	sqlite,
		// 	db,
		// 	data: {
		// 		entity_id: changeSetElementChange.entity_id,
		// 		schema_key: "lix_change_set_element",
		// 		file_id: "lix",
		// 		plugin_key: "lix_own_entity",
		// 		snapshot_content: JSON.stringify({
		// 			change_set_id: changeSetId,
		// 			change_id: changeSetElementChange.id,
		// 			schema_key: "lix_change_set_element",
		// 			file_id: "lix",
		// 			entity_id: changeSetElementChange.entity_id,
		// 		} satisfies ChangeSetElement),
		// 	},
		// });
	}

	return 1;
}

function createChangeWithSnapshot(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	id?: string;
	data: Omit<NewStateRow, "version_id" | "created_at" | "updated_at">;
}): Pick<Change, "id" | "schema_key" | "file_id" | "entity_id"> {
	const [snapshot] = args.data.snapshot_content
		? executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.insertInto("internal_snapshot")
					.values({
						content: sql`jsonb(${args.data.snapshot_content})`,
					})
					.returning("id"),
			})
		: [{ id: "no-content" }];

	const [change] = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("internal_change")
			.values({
				id: args.id,
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				snapshot_id: snapshot.id,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				schema_version: args.data.schema_version,
			})
			.returning(["id", "schema_key", "file_id", "entity_id"]),
	});

	return change;
}
