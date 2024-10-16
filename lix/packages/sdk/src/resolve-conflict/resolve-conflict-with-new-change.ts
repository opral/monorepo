import type {
	Conflict,
	NewChangeWithSnapshot,
	NewSnapshot,
} from "../database/schema.js";
import type { Lix } from "../types.js";
import {
	ChangeAlreadyExistsError,
	ChangeDoesNotBelongToFileError,
	ChangeNotDirectChildOfConflictError,
} from "./errors.js";

/**
 * Resolves a conflict by applying the given change.
 */
export async function resolveConflictWithNewChange(args: {
	lix: Lix;
	conflict: Conflict;
	newChange: NewChangeWithSnapshot;
}): Promise<void> {
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
		.where("id", "=", args.conflict.change_id)
		.executeTakeFirstOrThrow();

	if (change.file_id !== args.newChange.file_id) {
		throw new ChangeDoesNotBelongToFileError();
	} else if (change.id !== args.newChange.parent_id) {
		throw new ChangeNotDirectChildOfConflictError();
	}

	const newChangeAlreadyExists = args.newChange.id
		? await args.lix.db
				.selectFrom("change")
				.select("id")
				.where("id", "=", args.newChange.id)
				.executeTakeFirst()
		: undefined;

	if (newChangeAlreadyExists) {
		throw new ChangeAlreadyExistsError({ id: args.newChange.id! });
	}

	const file = await args.lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", change.file_id)
		.executeTakeFirstOrThrow();

	const { fileData } = await plugin.applyChanges({
		lix: args.lix,
		file: file,
		changes: [
			// @ts-expect-error - this will need fixing (setting up eslint atm)
			args.resolveWithChange,
		],
	});

	const snapshot: NewSnapshot = {
		id: args.newChange.snapshot_id,
		value: args.newChange.value,
	};

	delete args.newChange.value;

	await args.lix.db.transaction().execute(async (trx) => {
		await trx
			.updateTable("file")
			.set("data", fileData)
			.where("id", "=", change.file_id)
			.execute();

		const insertedChange = await trx
			.insertInto("change")
			.values(args.newChange)
			.returning("id")
			.executeTakeFirstOrThrow();

		await trx.insertInto("snapshot").values(snapshot).execute();

		await trx
			.updateTable("conflict")
			.where((eb) =>
				eb.and({
					change_id: args.conflict.change_id,
					conflicting_change_id: args.conflict.conflicting_change_id,
					resolved_with_change_id: undefined,
				}),
			)
			.set("resolved_with_change_id", insertedChange.id)
			.execute();
	});
}
