import { describe, test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixPlugin } from "./lix-plugin.js";
import { handleFileInsert } from "../file/file-handlers.js";
import { executeSync } from "../database/execute-sync.js";

describe("detectChanges()", () => {
	test("exposes query and executeSync", async () => {
		const plugin: LixPlugin = {
			key: "plugin_query_test",
			detectChangesGlob: "*",
			detectChanges: ({ after, lix }) => {
				// Build a typed Kysely query builder via lix
				const qb = lix!.db
					.selectFrom("state")
					.where("file_id", "=", after.id)
					.select([
						"entity_id",
						"schema_key",
						"file_id",
						"plugin_key",
						"snapshot_content",
					]);

				// Execute synchronously with JSON parsing compatibility
				const rows = executeSync({ engine: lix!.engine!, query: qb });

				expect(Array.isArray(rows)).toBe(true);
				expect(rows.length).toBeGreaterThan(0);
				// The file insert handler stores a file descriptor snapshot first
				const hasFileDescriptor = rows.some(
					(r: any) => r.schema_key === "lix_file_descriptor"
				);
				expect(hasFileDescriptor).toBe(true);

				// no plugin changes emitted in this probe
				return [];
			},
		};

		const lix = await openLix({ providePlugins: [plugin] });

		// Acquire active version id for handlers
		const active = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirst();
		const versionId = active!.version_id as unknown as string;

		// Insert a file to trigger plugin.detectChanges
		const file = {
			id: "file_query_test",
			path: "/test.txt",
			data: new Uint8Array(),
			metadata: {},
		};
		const rc = handleFileInsert({ engine: lix.engine!, file, versionId });
		expect(rc).toBeTypeOf("number");
	});
});
