import { sql } from "kysely";
import type { LixEngine } from "../../engine/boot.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { commitIsAncestorOf } from "../../query-filter/commit-is-ancestor-of.js";
import { uuidV7Sync } from "../../engine/functions/uuid-v7.js";
import { LixChangeSetElementSchema } from "../../change-set/schema-definition.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";

export type WorkingChange = {
	id: string;
	entity_id: string;
	schema_key: string;
	file_id: string;
	snapshot_content: string | null;
};

type RefreshArgs = {
	engine: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
	version: {
		id: string;
		commit_id: string | null;
		working_commit_id: string | null;
	};
	timestamp: string;
	changes: WorkingChange[];
};

export function refreshWorkingChangeSet(args: RefreshArgs): void {
	const { engine, version, timestamp } = args;
	if (version.id === "global") return;
	if (!version.working_commit_id) return;
	if (args.changes.length === 0) return;

	const workingCommitRow = engine.executeSync(
		internalQueryBuilder
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "lix_commit")
			.where("entity_id", "=", version.working_commit_id)
			.where("snapshot_content", "is not", null)
			.select("snapshot_content")
			.limit(1)
			.compile()
	).rows as Array<{ snapshot_content: string }>;

	const workingCommit = workingCommitRow[0]?.snapshot_content
		? JSON.parse(workingCommitRow[0].snapshot_content)
		: undefined;
	const workingChangeSetId = workingCommit?.change_set_id as string | undefined;
	if (!workingChangeSetId) return;

	if (args.changes.length === 0) return;

	const deletionChanges: WorkingChange[] = [];
	const nonDeletionChanges: WorkingChange[] = [];

	for (const change of args.changes) {
		let isDeletion = true;
		if (change.snapshot_content) {
			try {
				const parsed = JSON.parse(change.snapshot_content);
				isDeletion = parsed?.snapshot_id === "no-content";
			} catch {
				isDeletion = false;
			}
		}
		if (isDeletion) deletionChanges.push(change);
		else nonDeletionChanges.push(change);
	}

	const entitiesAtCheckpoint = new Set<string>();
	// Use the working commit lineage to find the checkpoint. This keeps the history linear
	// for the mutable branch and avoids walking through merge commits that belong to other branches.
	if (
		deletionChanges.length > 0 &&
		version.working_commit_id &&
		version.working_commit_id.length > 0
	) {
		const checkpointCommitResult = engine.executeSync(
			internalQueryBuilder
				.selectFrom("commit")
				.innerJoin("entity_label", (join) =>
					join
						.onRef("entity_label.entity_id", "=", "commit.id")
						.on("entity_label.schema_key", "=", "lix_commit")
				)
				.innerJoin("label", "label.id", "entity_label.label_id")
				.where("label.name", "=", "checkpoint")
				.where(
					commitIsAncestorOf(
						{ id: version.working_commit_id },
						{ includeSelf: true, depth: 1 }
					)
				)
				.select("commit.id")
				.limit(1)
				.compile()
		).rows as Array<{ id: string }>;

		const checkpointCommitId = checkpointCommitResult[0]?.id;
		if (checkpointCommitId) {
			const checkpointRows = engine.executeSync(
				internalQueryBuilder
					.selectFrom("state_history")
					.where("depth", "=", 0)
					.where("commit_id", "=", checkpointCommitId)
					.where((eb) =>
						eb.or(
							deletionChanges.map((change) =>
								eb.and([
									eb("entity_id", "=", change.entity_id),
									eb("schema_key", "=", change.schema_key),
									eb("file_id", "=", change.file_id),
								])
							)
						)
					)
					.select(["entity_id", "schema_key", "file_id"])
					.compile()
			).rows as Array<{
				entity_id: string;
				schema_key: string;
				file_id: string;
			}>;
			for (const entity of checkpointRows) {
				entitiesAtCheckpoint.add(
					`${entity.entity_id}|${entity.schema_key}|${entity.file_id}`
				);
			}
		}
	}

	const uniqueTargets: Array<{
		entity_id: string;
		schema_key: string;
		file_id: string;
	}> = [];
	const seen = new Set<string>();
	for (const change of args.changes) {
		const key = `${change.entity_id}~${change.schema_key}~${change.file_id}`;
		if (seen.has(key)) continue;
		seen.add(key);
		uniqueTargets.push({
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		});
	}

	type ExistingCse = {
		_pk: string;
		entity_id: string;
		element_entity_id: string;
		element_schema_key: string;
		element_file_id: string;
	};

	let existingEntities: ExistingCse[] = [];
	if (uniqueTargets.length > 0) {
		const literalTable = sql<{
			entity_id: string;
			schema_key: string;
			file_id: string;
		}>`
			(${sql.join(
				uniqueTargets.map(
					(target) =>
						sql`SELECT ${target.entity_id} AS entity_id, ${target.schema_key} AS schema_key, ${target.file_id} AS file_id`
				),
				sql` UNION ALL `
			)})
			target_entities
		`;

		const cleanupQuery = internalQueryBuilder
			.selectFrom("lix_internal_state_vtable as cse")
			.select([
				sql`cse."_pk"`.as("_pk"),
				sql`cse."entity_id"`.as("entity_id"),
				sql`json_extract(cse.snapshot_content, '$.entity_id')`.as(
					"element_entity_id"
				),
				sql`json_extract(cse.snapshot_content, '$.schema_key')`.as(
					"element_schema_key"
				),
				sql`json_extract(cse.snapshot_content, '$.file_id')`.as(
					"element_file_id"
				),
			])
			.where("cse.entity_id", "like", `${workingChangeSetId}~%`)
			.where("cse.schema_key", "=", "lix_change_set_element")
			.where("cse.file_id", "=", "lix")
			.where("cse.version_id", "=", "global")
			.innerJoin(literalTable as any, (join: any) =>
				join
					.on(
						sql`json_extract(cse.snapshot_content, '$.entity_id')`,
						"=",
						sql`target_entities.entity_id`
					)
					.on(
						sql`json_extract(cse.snapshot_content, '$.schema_key')`,
						"=",
						sql`target_entities.schema_key`
					)
					.on(
						sql`json_extract(cse.snapshot_content, '$.file_id')`,
						"=",
						sql`target_entities.file_id`
					)
			)
			.compile();

		existingEntities = engine.executeSync(cleanupQuery).rows as ExistingCse[];
	}

	const batch: Array<{
		id?: string;
		entity_id: string;
		schema_key: string;
		file_id: string;
		plugin_key: string;
		snapshot_content: string | null;
		schema_version: string;
		created_at: string;
		lixcol_version_id: string;
	}> = [];

	for (const existing of existingEntities) {
		batch.push({
			id: uuidV7Sync({ engine }),
			entity_id: existing.entity_id,
			schema_key: "lix_change_set_element",
			file_id: "lix",
			plugin_key: "lix_sdk",
			snapshot_content: null,
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			created_at: timestamp,
			lixcol_version_id: "global",
		});
	}

	for (const deletion of deletionChanges) {
		const key = `${deletion.entity_id}|${deletion.schema_key}|${deletion.file_id}`;
		if (!entitiesAtCheckpoint.has(key)) continue;
		batch.push({
			id: uuidV7Sync({ engine }),
			entity_id: `${workingChangeSetId}~${deletion.id}`,
			schema_key: "lix_change_set_element",
			file_id: "lix",
			plugin_key: "lix_sdk",
			snapshot_content: JSON.stringify({
				change_set_id: workingChangeSetId,
				change_id: deletion.id,
				entity_id: deletion.entity_id,
				schema_key: deletion.schema_key,
				file_id: deletion.file_id,
			}),
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			created_at: timestamp,
			lixcol_version_id: "global",
		});
	}

	for (const change of nonDeletionChanges) {
		batch.push({
			id: uuidV7Sync({ engine }),
			entity_id: `${workingChangeSetId}~${change.id}`,
			schema_key: "lix_change_set_element",
			file_id: "lix",
			plugin_key: "lix_sdk",
			snapshot_content: JSON.stringify({
				change_set_id: workingChangeSetId,
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			}),
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			created_at: timestamp,
			lixcol_version_id: "global",
		});
	}

	if (batch.length > 0) {
		updateUntrackedState({
			engine,
			changes: batch,
		});
	}
}
