import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { handleInsertOnView } from "./handle-insert-on-view.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "./schema.js";

test("throws if the schema is not valid", async () => {
	const lix = await openLixInMemory({});

	expect(() =>
		handleInsertOnView(
			lix.sqlite,
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>,
			"version",
			"id",
			"some-id",
			// a version does not define "unknown-prop"
			"unknown-prop",
			"should throw"
		)
	).toThrowError(/The provided snapshot content does not match the schema./);
});
