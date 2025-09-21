import { type LixCommit, LixCommitSchema } from "../commit/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { State } from "../entity-views/types.js";
import type { LixChangeRaw } from "../change/schema.js";
import type { StateCommitChange } from "../hooks/create-hooks.js";
import { getTimestampSync } from "../engine/functions/timestamp.js";
import { updateStateCache } from "./cache/update-state-cache.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";
import type { LixEngine } from "../engine/boot.js";
import { type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import {
	LixVersionDescriptorSchema,
	LixVersionTipSchema,
	type LixVersionDescriptor,
	type LixVersionTip,
} from "../version/schema.js";
import {
	LixEntityLabelSchema,
	type LixEntityLabel,
} from "../entity/label/schema.js";

/**
 * Converts the current working change set into a checkpoint.
 *
 * The working change set becomes immutable and receives the
 * `checkpoint` label. A fresh empty working change set is created so
 * that new changes can continue to accumulate.
 *
 * @example
 * ```ts
 * const { id } = await createCheckpoint({ lix })
 * ```
 */

/**
 * @param args.engine - The engine context bound to SQLite
 */
export async function createCheckpointSync(args: {
	engine: LixEngine;
}): Promise<State<LixCommit>> {
	const engine = args.engine;
	const db = engine.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const executeInTransaction = async (
		trx: Kysely<LixInternalDatabaseSchema>
	) => {
		// Get current active version
		const activeVersion = await trx
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Get the working commit and its change set
		const workingCommit = await trx
			.selectFrom("commit")
			.where("id", "=", activeVersion.working_commit_id)
			.select(["id", "parent_commit_ids", "change_set_id"])
			.executeTakeFirstOrThrow();

		const workingChangeSetId = workingCommit.change_set_id;

		// Check if there are any working change set elements to checkpoint
		const workingElements = await trx
			.selectFrom("change_set_element_all")
			.where("change_set_id", "=", workingChangeSetId)
			.innerJoin("change", "change.id", "change_set_element_all.change_id")
			.where("lixcol_version_id", "=", "global")
			.select(["change.id", "change.snapshot_content"])
			.execute();

		if (workingElements.length === 0) {
			// Idempotent behavior: if working set is clean, return the current head commit
			const headCommit = await trx
				.selectFrom("commit_all")
				.selectAll()
				.where("id", "=", activeVersion.commit_id)
				.where("lixcol_version_id", "=", "global")
				.executeTakeFirstOrThrow();
			return headCommit;
		}

		// 1) Prepare ids
		const checkpointCommitId = activeVersion.working_commit_id;
		const newWorkingChangeSetId = uuidV7Sync({ engine });
		const newWorkingCommitId = uuidV7Sync({ engine });

		// 2) Ensure checkpoint label exists
		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		// Update version tip + descriptor via change + cache (avoid version view writes)
		const now = getTimestampSync({ engine });
		const descriptorChange: LixChangeRaw = {
			id: uuidV7Sync({ engine }),
			entity_id: activeVersion.id,
			schema_key: LixVersionDescriptorSchema["x-lix-key"],
			schema_version: LixVersionDescriptorSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: activeVersion.id,
				name: activeVersion.name,
				inherits_from_version_id: activeVersion.inherits_from_version_id,
				hidden: activeVersion.hidden,
			} satisfies LixVersionDescriptor),
			created_at: now,
		};
		const tipChange: LixChangeRaw = {
			id: uuidV7Sync({ engine }),
			entity_id: activeVersion.id,
			schema_key: LixVersionTipSchema["x-lix-key"],
			schema_version: LixVersionTipSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: activeVersion.id,
				commit_id: checkpointCommitId,
				working_commit_id: newWorkingCommitId,
			} satisfies LixVersionTip),
			created_at: now,
		};

		const workingDomainChangeIds = workingElements
			.map((r: any) => r.change_id as string | null)
			.filter((id): id is string => Boolean(id));

		// Merge in the previous tip (A) as an additional parent to WC
		const mergedParents = Array.from(
			new Set<string>([
				...(workingCommit.parent_commit_ids ?? []),
				activeVersion.commit_id,
			])
		);

		// Pre-generate label change id so we can track it in checkpoint change_ids
		const labelChangeId = uuidV7Sync({ engine });

		// Commit change rows (checkpoint + new working)
		const checkpointCommitChange: LixChangeRaw = {
			id: uuidV7Sync({ engine }),
			entity_id: checkpointCommitId,
			schema_key: LixCommitSchema["x-lix-key"],
			schema_version: LixCommitSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: checkpointCommitId,
				change_set_id: workingChangeSetId,
				parent_commit_ids: mergedParents,
				change_ids: [...workingDomainChangeIds, labelChangeId],
			}),
			created_at: now,
		};
		const newWorkingCommitChange: LixChangeRaw = {
			id: uuidV7Sync({ engine }),
			entity_id: newWorkingCommitId,
			schema_key: LixCommitSchema["x-lix-key"],
			schema_version: LixCommitSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: newWorkingCommitId,
				change_set_id: newWorkingChangeSetId,
				parent_commit_ids: [checkpointCommitId],
				change_ids: [],
			} satisfies LixCommit),
			created_at: now,
		};
		const labelChange: LixChangeRaw = {
			id: labelChangeId,
			entity_id: `${checkpointCommitId}~${checkpointLabel.id}`,
			schema_key: LixEntityLabelSchema["x-lix-key"],
			schema_version: LixEntityLabelSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				entity_id: checkpointCommitId,
				schema_key: "lix_commit",
				file_id: "lix",
				label_id: checkpointLabel.id,
			} satisfies LixEntityLabel),
			created_at: now,
		};

		// Persist changes and update cache without creating a meta-commit
		await trx
			.insertInto("change")
			.values([
				descriptorChange as any,
				tipChange as any,
				checkpointCommitChange as any,
				newWorkingCommitChange as any,
				labelChange as any,
			])
			.execute();
		const materializedChanges = [
			{
				...descriptorChange,
				lixcol_version_id: "global" as const,
				lixcol_commit_id: checkpointCommitId,
			},
			{
				...tipChange,
				lixcol_version_id: "global" as const,
				lixcol_commit_id: checkpointCommitId,
			},
			{
				...checkpointCommitChange,
				lixcol_version_id: "global" as const,
				lixcol_commit_id: checkpointCommitId,
			},
			{
				...newWorkingCommitChange,
				lixcol_version_id: "global" as const,
				lixcol_commit_id: newWorkingCommitId,
			},
			{
				...labelChange,
				lixcol_version_id: activeVersion.id,
				lixcol_commit_id: checkpointCommitId,
			},
		] satisfies Array<
			LixChangeRaw & {
				lixcol_version_id: string;
				lixcol_commit_id: string;
			}
		>;

		updateStateCache({
			engine,
			changes: materializedChanges,
		});

		const hookChanges: StateCommitChange[] = materializedChanges.map(
			(change) => ({
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				schema_version: change.schema_version,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				created_at: change.created_at,
				snapshot_content: change.snapshot_content
					? JSON.parse(change.snapshot_content)
					: null,
				metadata: change.metadata ? JSON.parse(change.metadata) : null,
				version_id: change.lixcol_version_id,
				commit_id: change.lixcol_commit_id,
				untracked: 0,
				writer_key: null,
			})
		);

		// Bridge state_commit so reactive queries observe the new working commit/descriptor state.
		args.engine.hooks._emit("state_commit", { changes: hookChanges });

		// Return the checkpoint commit (old working)
		const createdCommit = await trx
			.selectFrom("commit_all")
			.selectAll()
			.where("id", "=", checkpointCommitId)
			.where("lixcol_version_id", "=", "global")
			.executeTakeFirstOrThrow();

		return createdCommit;
	};

	if (db.isTransaction) {
		return executeInTransaction(db);
	} else {
		return db.transaction().execute(executeInTransaction);
	}
}

export async function createCheckpoint(args: {
	lix: Lix;
}): Promise<State<LixCommit>> {
	type R = Awaited<ReturnType<typeof createCheckpointSync>>;
	const res = await args.lix.call("lix_create_checkpoint");
	return res as R;
}
