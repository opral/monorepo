import type { Change, Conflict } from "../schema.js";
import type { Lix } from "../types.js";

/**
 * Resolves a conflict by applying the given change.
 */
export async function resolveConflict(args: {
	lix: Lix;
	conflict: Conflict;
	resolveWithChange: Change;
}): Promise<void> {
	if (args.lix.plugins.length !== 1) {
		throw new Error("Unimplemented. Only one plugin is supported for now");
	}

	if (args.conflict.resolved_with_change_id !== null) {
		throw new Error("Conflict already resolved");
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
		.where("id", "=", args.conflict.change_id)
		.executeTakeFirst();

	const potentiallyExistingResolvedChange = await args.lix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", args.resolveWithChange.id)
		.executeTakeFirst();

	// verify that the existing change does not differ from the resolveWithChange
	// (changes are immutable). A change that is the result of a merge resolution
	// should be a new change.

	if (
		potentiallyExistingResolvedChange &&
		JSON.stringify(potentiallyExistingResolvedChange) !==
			JSON.stringify(args.resolveWithChange)
	) {
		throw new Error(
			"The to be resolved change id already exists in the database but both changes not equal. Changes are immutable. If you want to resolve a conflict by updating a change, create a new change.",
		);
	}

	// it's a new change (likely a result of a merge resolution)
	if (potentiallyExistingResolvedChange === undefined) {
		if (
			// TODO a change can have multiple parents. Displaying branches and merges is not possible if we only allow one parent.
			args.resolveWithChange.parent_id !== args.conflict.change_id ||
			args.resolveWithChange.parent_id !== args.conflict.conflicting_change_id
		) {
			throw new Error(
				"The to be resolved change is not a direct child of the conflicting changes. The parent_id of the resolveWithChange must be the id of the conflict or the conflicting change.",
			);
		} else if (args.resolveWithChange.file_id !== change?.file_id) {
			throw new Error(
				"The to be resolved change does not belong to the same file as the conflicting changes",
			);
		}
	}

	const file = await args.lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", args.resolveWithChange.file_id)
		.executeTakeFirstOrThrow();

	const { fileData } = await plugin.applyChanges({
		lix: args.lix,
		file: file,
		changes: [args.resolveWithChange],
	});

	await args.lix.db.transaction().execute(async (trx) => {
		await trx
			.updateTable("file_internal")
			.set("data", fileData)
			.where("id", "=", args.resolveWithChange.file_id)
			.execute();

		// The change does not exist yet. (likely a merge resolution which led to a new change)
		if (potentiallyExistingResolvedChange === undefined) {
			await trx
				.insertInto("change")
				.values({
					...args.resolveWithChange,
					// @ts-expect-error - manual stringification
					value: JSON.stringify(args.resolveWithChange.value),
					// @ts-expect-error - manual stringification
					meta: JSON.stringify(args.resolveWithChange.meta),
				})
				.execute();
		}

		await trx
			.updateTable("conflict")
			.where((eb) =>
				eb.and({
					change_id: args.conflict.change_id,
					conflicting_change_id: args.conflict.conflicting_change_id,
					// should not mutate conflicts for now
					resolved_with_change_id: undefined,
				}),
			)
			.set("resolved_with_change_id", args.resolveWithChange.id)
			.execute();
	});
}
