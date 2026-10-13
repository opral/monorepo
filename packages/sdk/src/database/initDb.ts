import { Kysely } from "kysely";
import type { Lix } from "@lix-js/sdk";
import type { InlangDatabaseSchema } from "./schema.js";
import { LixDialect } from "./lixDialect.js";
import { attachLix } from "./lixBatch.js";

export function initDb(args: { lix: Lix }) {
	const db = new Kysely<InlangDatabaseSchema>({
		dialect: new LixDialect(args.lix),
	});
	attachLix(db, args.lix);
	return db;
}
