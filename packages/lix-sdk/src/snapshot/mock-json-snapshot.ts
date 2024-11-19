import { sha256 } from "js-sha256";
import type { Snapshot } from "../database/schema.js";
import {
	createInMemoryDatabase,
	type SqliteDatabase,
} from "sqlite-wasm-kysely";

/**
 *
 * Util function for tests that creates a snapshot that looks like one you got returned from the database after inserting
 *
 */
export const mockJsonSnapshot = async function (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	content: Record<string, any>,
): Snapshot {
	const db = await createInMemoryDatabase({
		readOnly: false,
	});

	db.createFunction({
		name: "sha256",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			return value ? sha256(value as string) : "no-content";
		},
		deterministic: true,
	});

	const res = db.exec(`select sha256(CAST(jsonb(?) AS BLOB))`, {
		returnValue: "resultRows",
		bind: JSON.stringify(content),
	});

	return {
		id: res[0]![0] as string,
		content: content,
	};
};
