import { Kysely, sql } from "kysely";
import { contentFromDatabase, type SqliteDatabase } from "sqlite-wasm-kysely";
import type { Lix } from "@lix-js/sdk";
import type { InlangDatabaseSchema } from "../database/schema.js";
import type { State } from "./state/state.js";

/**
 * Saves updates of the database (file) to lix.
 */
export async function initHandleSaveToLixOnChange(args: {
	sqlite: SqliteDatabase;
	db: Kysely<InlangDatabaseSchema>;
	lix: Lix;
	state: Pick<State, "pendingPromises">;
}) {
	args.sqlite.createFunction({
		name: "save_db_file_to_lix",
		arity: 0,
		// @ts-expect-error - dynamic function
		xFunc: () => {
			// TODO handle in cancellable queue. only the last entry
			// in the queue needs to be pushed to the file table
			// because all previous entries are overwritten anyways
			args.state.pendingPromises.push(
				(async () => {
					// We have to await the database operations to be finished and the database to eb in a consistent state, otherwise contentFromDatabase will crash! 100 ms is too short for current test cases, but we need a proper solution for this
					await new Promise((resolve) => setTimeout(resolve, 400));
					const data = contentFromDatabase(args.sqlite);
					await args.lix.db
						.updateTable("file")
						.set("data", data)
						.where("path", "=", "/db.sqlite")
						.execute();
				})()
			);
			return;
		},
	});

	// better way to write to lix on updates?
	await sql`
	CREATE TEMP TRIGGER bundle_insert AFTER INSERT ON bundle
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER bundle_update AFTER UPDATE ON bundle
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER bundle_delete AFTER DELETE ON bundle
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

		CREATE TEMP TRIGGER message_insert AFTER INSERT ON message
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER message_update AFTER UPDATE ON message
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER message_delete AFTER DELETE ON message
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER variant_insert AFTER INSERT ON variant
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER variant_update AFTER UPDATE ON variant
	BEGIN
	  SELECT save_db_file_to_lix();
	END;

	CREATE TEMP TRIGGER variant_delete AFTER DELETE ON variant
	BEGIN
	  SELECT save_db_file_to_lix();
	END;


	`.execute(args.db);
}
