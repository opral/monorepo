import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";

export async function createCheckpoint(args: { lix: Lix }): Promise<{
	id: string;
}> {
	// const checkpointId = nanoid();

	// Get current active version
	const activeVersion = await args.lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Get the checkpoint label
	const checkpointLabel = await args.lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	// Get current working change set elements
	const workingElements = await args.lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.selectAll()
		.execute();

	if (workingElements.length === 0) {
		throw new Error(
			"No changes in working change set to create a checkpoint for."
		);
	}

	const changeSets = await args.lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	// Add checkpoint label to the change set
	await args.lix.db
		.insertInto("change_set_label")
		.values({
			change_set_id: activeVersion.working_change_set_id,
			label_id: checkpointLabel.id,
		})
		.execute();

	// Add all working elements to the checkpoint change set
	for (const element of workingElements) {
		await args.lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: activeVersion.working_change_set_id,
				change_id: element.change_id,
				entity_id: element.entity_id,
				schema_key: element.schema_key,
				file_id: element.file_id,
			})
			.execute();
	}

	// Create edge from current change set to checkpoint
	await args.lix.db
		.insertInto("change_set_edge")
		.values({
			parent_id: activeVersion.change_set_id,
			child_id: activeVersion.working_change_set_id,
		})
		.execute();

	// Create new working change set for continued work
	const newWorkingChangeSetId = nanoid();
	await args.lix.db
		.insertInto("change_set")
		.values({
			id: newWorkingChangeSetId,
		})
		.execute();

	// Update version to point to checkpoint and new working change set
	await args.lix.db
		.updateTable("version")
		.where("id", "=", activeVersion.id)
		.set({
			working_change_set_id: newWorkingChangeSetId,
		})
		.execute();

	return {
		id: activeVersion.working_change_set_id,
	};
}
