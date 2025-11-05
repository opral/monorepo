import { Kysely } from "kysely";
import { type InlangDatabaseSchema } from "./schema.js";
import { JsonPlugin } from "./jsonPlugin.js";
import { type Lix } from "@lix-js/sdk";

export function initDb(lix: Lix): Kysely<InlangDatabaseSchema> {
	const engine = lix.engine;
	if (engine === undefined) {
		throw new Error(
			"Lix engine is not available. initDb requires an in-process Lix engine to enable JSON helpers."
		);
	}

	engine.sqlite.exec("PRAGMA foreign_keys = ON");

	return lix.db
		.withPlugin(new JsonPlugin({ engine }))
		.withTables<InlangDatabaseSchema>() as unknown as Kysely<InlangDatabaseSchema>;
}
