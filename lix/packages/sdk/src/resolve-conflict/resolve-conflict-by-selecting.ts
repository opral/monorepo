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

	const change = await args.lix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", args.selectChangeId)
		.executeTakeFirstOrThrow();

	const file = await args.lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", change.file_id)
		.executeTakeFirstOrThrow();

	const { fileData } = await plugin.applyChanges({
		lix: args.lix,
		file: file,
		changes: [change],
	});

	await args.lix.db.transaction().execute(async (trx) => {
		await trx
			.updateTable("file")
			.set("data", fileData)
			.where("id", "=", change.file_id)
			.executeTakeFirstOrThrow();

		await trx
			.updateTable("conflict")
			.where((eb) =>
				eb.and({
					change_id: args.conflict.change_id,
					conflicting_change_id: args.conflict.conflicting_change_id,
					resolved_with_change_id: undefined,
				}),
			)
			.set("resolved_with_change_id", change.id)
			.executeTakeFirstOrThrow();
	});
}
