import type { Change, Conflict } from "../database/schema.js";
import type { Lix } from "../types.js";
import { SelectedChangeNotInConflictError } from "./errors.js";

/**
 * Resolves a conflict by selecting one of the two
 * changes in the conflict.
 */
export async function resolveConflictBySelecting(args: {
	lix: Lix;
	conflict: Conflict;
	selectChangeId: Change["id"];
}): Promise<void> {
	if (
		args.conflict.change_id !== args.selectChangeId &&
		args.conflict.conflicting_change_id !== args.selectChangeId
	) {
		throw new SelectedChangeNotInConflictError({
			selectedChangeId: args.selectChangeId,
			conflict: args.conflict,
		});
	}

	if (args.lix.plugins.length !== 1) {
		throw new Error("Unimplemented. Only one plugin is supported for now");
	}

	const plugin = args.lix.plugins[0];
	if (plugin?.applyChanges === undefined) {
		throw new Error(
			"Plugin does not support applying changes and therefore cannot resolve conflicts",
		);
	}
	const selectedChange = await args.lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.value")
		.where("change.id", "=", args.selectChangeId)
		.executeTakeFirst();

	if (selectedChange === undefined) {
		throw new Error(
			"The selected change has not been found. If you want to resolve a conflict by selecting a change, the change must exist.",
		);
	}

	const file = await args.lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", selectedChange.file_id)
		.executeTakeFirst();

	if (file === undefined) {
		throw new Error(
			"The file of the selected change has not been found. If you want to resolve a conflict by selecting a change, the file must exist to apply the selected change.",
		);
	}

	const { fileData } = await plugin.applyChanges({
		lix: args.lix,
		file: file,
		changes: [selectedChange],
	});

	await args.lix.db.transaction().execute(async (trx) => {
		await trx
			.updateTable("file")
			.set("data", fileData)
			.where("id", "=", selectedChange.file_id)
			.executeTakeFirstOrThrow();

		await trx
			.updateTable("conflict")
			.where((eb) =>
				eb.and({
					change_id: args.conflict.change_id,
					conflicting_change_id: args.conflict.conflicting_change_id,
					resolved_change_id: undefined,
				}),
			)
			.set("resolved_change_id", selectedChange.id)
			.executeTakeFirstOrThrow();
	});
}
