import { describe, test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixPlugin } from "./lix-plugin.js";
import { handleFileInsert } from "../file/file-handlers.js";
// no direct executeSync import needed with querySync

describe("detectChanges()", () => {
	test("exposes querySync for sync Kysely", async () => {
		const plugin: LixPlugin = {
			key: "plugin_query_test",
			detectChangesGlob: "*",
			detectChanges: ({ after, querySync }) => {
				// Build a typed Kysely query via querySync and execute synchronously
				const rows = querySync("state")
					.where("file_id", "=", after.id)
					.select([
						"entity_id",
						"schema_key",
						"file_id",
						"plugin_key",
						"snapshot_content",
					])
					.execute();

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
