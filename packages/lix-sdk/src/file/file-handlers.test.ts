import { describe, it, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "../version/create-version.js";
import { handleFileInsert, handleFileUpdate } from "./file-handlers.js";
import { nanoid } from "../database/nano-id.js";

describe("file insert", () => {
	it("should handle unknown file types with fallback plugin", async () => {
		const lix = await openLixInMemory({
			keyValues: [
				{
					key: "lix_log_levels",
					value: ["debug", "info", "warn", "error"],
				},
			],
		});
		const version = await createVersion({ lix });

		// Insert unknown file type - should be handled by unknown file plugin
		handleFileInsert({
			lix,
			file: {
				id: nanoid(),
				path: "/test.unknown",
				data: new TextEncoder().encode("some content"),
				version_id: version.id,
				metadata: null,
			},
		});

		// Should log "no plugin" warning but still handle the file with fallback plugin
		const logs = await lix.db
			.selectFrom("log")
			.where("key", "=", "lix_file_no_plugin")
			.where("level", "=", "warn")
			.selectAll()
			.execute();

		expect(logs.length).toBe(1);
	});
});

describe("file update", () => {
	it("should handle unknown file types with fallback plugin", async () => {
		const lix = await openLixInMemory({
			keyValues: [
				{
					key: "lix_log_levels",
					value: ["debug", "info", "warn", "error"],
				},
			],
		});
		const version = await createVersion({ lix });
		const fileId = nanoid();

		// Manually insert the file into the file table first
		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/test.unknown",
				data: new TextEncoder().encode('some data'),
				version_id: version.id,
				metadata: null,
			})
			.execute();

		// Update with different data - should be handled by unknown file plugin
		handleFileUpdate({
			lix,
			file: {
				id: fileId,
				path: "/test.unknown",
				data: new TextEncoder().encode('updated data'),
				version_id: version.id,
				metadata: null,
			},
		});

		// Should log "no plugin" warning but still handle the file with fallback plugin
		const logs = await lix.db
			.selectFrom("log")
			.where("key", "=", "lix_file_no_plugin")
			.where("level", "=", "warn")
			.selectAll()
			.execute();

		expect(logs.length).toBeGreaterThanOrEqual(1);
	});
});
