import { describe, it, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { handleFileInsert, handleFileUpdate } from "./file-handlers.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { randomNanoId } from "../database/nano-id.js";

describe("file insert", () => {
	it("should handle unknown file types with fallback plugin", async () => {
		const lix = await openLix({
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
				id: randomNanoId(),
				path: "/test.unknown",
				data: new TextEncoder().encode("some content"),
				metadata: null,
			},
			versionId: version.id,
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
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_log_levels",
					value: ["debug", "info", "warn", "error"],
				},
			],
		});
		const version = await createVersion({ lix });
		const fileId = randomNanoId();

		// Manually insert the file into the file table first
		await lix.db
			.insertInto("file_all")
			.values({
				id: fileId,
				path: "/test.unknown",
				data: new TextEncoder().encode("some data"),
				lixcol_version_id: version.id,
				metadata: null,
			})
			.execute();

		// Update with different data - should be handled by unknown file plugin
		handleFileUpdate({
			lix,
			file: {
				id: fileId,
				path: "/test.unknown",
				data: new TextEncoder().encode("updated data"),
				metadata: null,
			},
			versionId: version.id,
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

	it("should handle deleted entities during file update", async () => {
		const lix = await openLix({
			providePlugins: [mockJsonPlugin],
		});
		const version = await createVersion({ lix });
		const fileId = randomNanoId();

		// Initial JSON data with two users
		const initialJsonData = {
			users: {
				john: { name: "John", age: 30 },
				jane: { name: "Jane", age: 25 },
			},
		};

		// Insert the file initially - this should create entities for both users
		handleFileInsert({
			lix,
			file: {
				id: fileId,
				path: "/users.json",
				data: new TextEncoder().encode(JSON.stringify(initialJsonData)),
				metadata: null,
			},
			versionId: version.id,
		});

		// Verify both entities were created
		const initialEntities = await lix.db
			.selectFrom("state_all")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", "mock_json_property")
			.where("version_id", "=", version.id)
			.selectAll()
			.execute();

		expect(initialEntities.length).toBeGreaterThan(0);

		// Updated JSON data with jane removed
		const updatedJsonData = {
			users: {
				john: { name: "John", age: 30 },
				// jane is removed
			},
		};

		// Update the file - this should trigger deletion of jane's entities
		handleFileUpdate({
			lix,
			file: {
				id: fileId,
				path: "/users.json",
				data: new TextEncoder().encode(JSON.stringify(updatedJsonData)),
				metadata: null,
			},
			versionId: version.id,
		});

		// Verify that jane's entities were deleted
		const finalEntities = await lix.db
			.selectFrom("state_all")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", "mock_json_property")
			.where("version_id", "=", version.id)
			.selectAll()
			.execute();

		// Should have fewer entities after the update (jane's entities removed)
		expect(finalEntities.length).toBeLessThan(initialEntities.length);

		// John's entities should still exist
		const johnEntities = finalEntities.filter((e) =>
			e.entity_id.includes("john")
		);
		expect(johnEntities.length).toBeGreaterThan(0);

		// Jane's entities should be gone
		const janeEntities = finalEntities.filter((e) =>
			e.entity_id.includes("jane")
		);
		expect(janeEntities.length).toBe(0);
	});
});
