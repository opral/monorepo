import {
	applyChanges,
	ChangeSet,
	createCheckpoint,
	fileQueueSettled,
} from "@lix-js/sdk";
import { selectWorkingChangeSet } from "../queries";
import { lix } from "../state";

export async function mergeChangeSet(changeSetId: ChangeSet["id"]) {
	const currentSet = await selectWorkingChangeSet();

	if ((currentSet?.change_count ?? 0) > 0) {
		await createCheckpoint({ lix });
	}

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id",
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.selectAll("change")
		.execute();

	await applyChanges({
		lix,
		changes,
		skipFileQueue: false,
	});

	await fileQueueSettled({ lix });

	await lix.db
		.updateTable("key_value")
		.where("key", "=", "expandedChangeSetId")
		.set({ value: JSON.stringify(null) })
		.execute();
}
