import { describe, expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { refreshWorkingChangeSet } from "./refresh-working-change-set.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";

describe("refreshWorkingChangeSet", () => {
	test("adds working change set entries for non-deletion changes", async () => {
		const lix = await openLix({});
		const version = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.select(["id", "commit_id", "working_commit_id"])
			.executeTakeFirstOrThrow();

		const timestamp = new Date().toISOString();
		refreshWorkingChangeSet({
			engine: lix.engine!,
			version,
			timestamp,
			changes: [
				{
					id: "refresh-change-1",
					entity_id: "entity-refresh-1",
					schema_key: "refresh_schema",
					file_id: "file-refresh",
					snapshot_content: JSON.stringify({ v: "hello" }),
				},
			],
		});

		const workingCommitRow = lix.engine!.executeSync(
			internalQueryBuilder
				.selectFrom("lix_internal_state_vtable")
				.where("schema_key", "=", "lix_commit")
				.where("entity_id", "=", version.working_commit_id)
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1)
				.compile()
		).rows as Array<{ snapshot_content: string }>;
		const workingChangeSetId = JSON.parse(workingCommitRow[0]!.snapshot_content)
			.change_set_id as string;

		const rows = lix.engine!.executeSync(
			internalQueryBuilder
				.selectFrom("lix_internal_state_vtable")
				.where("schema_key", "=", "lix_change_set_element")
				.where("entity_id", "like", `${workingChangeSetId}~%`)
				.select(["entity_id"])
				.compile()
		).rows as Array<{ entity_id: string }>;

		expect(
			rows.some(
				(row) => row.entity_id === `${workingChangeSetId}~refresh-change-1`
			)
		).toBe(true);

		await lix.close();
	});

	test("ignores deletion entries that never existed in the checkpoint", async () => {
		const lix = await openLix({});
		const version = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.select(["id", "commit_id", "working_commit_id"])
			.executeTakeFirstOrThrow();

		const timestamp = new Date().toISOString();
		refreshWorkingChangeSet({
			engine: lix.engine!,
			version,
			timestamp,
			changes: [
				{
					id: "refresh-change-2",
					entity_id: "entity-refresh-2",
					schema_key: "refresh_schema",
					file_id: "file-refresh",
					snapshot_content: JSON.stringify({ snapshot_id: "no-content" }),
				},
			],
		});

		const workingCommitRow = lix.engine!.executeSync(
			internalQueryBuilder
				.selectFrom("lix_internal_state_vtable")
				.where("schema_key", "=", "lix_commit")
				.where("entity_id", "=", version.working_commit_id)
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1)
				.compile()
		).rows as Array<{ snapshot_content: string }>;
		const workingChangeSetId = JSON.parse(workingCommitRow[0]!.snapshot_content)
			.change_set_id as string;

		const rows = lix.engine!.executeSync(
			internalQueryBuilder
				.selectFrom("lix_internal_state_vtable")
				.where("schema_key", "=", "lix_change_set_element")
				.where("entity_id", "like", `${workingChangeSetId}~%`)
				.select(["entity_id"])
				.compile()
		).rows as Array<{ entity_id: string }>;

		expect(
			rows.some(
				(row) => row.entity_id === `${workingChangeSetId}~refresh-change-2`
			)
		).toBe(false);

		await lix.close();
	});
});
