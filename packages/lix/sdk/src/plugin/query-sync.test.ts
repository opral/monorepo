import { describe, test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createQuerySync } from "./query-sync.js";

describe("querySync", () => {
	test("builds Kysely-like query and executes synchronously", async () => {
		const lix = await openLix({});

		// Seed a value using normal async Kysely API
		await lix.db
			.insertInto("key_value")
			.values({ key: "qsync_foo", value: { hello: "world" } })
			.execute();

		const querySync = createQuerySync({ engine: lix.engine! });

		// Same Kysely QB chain, but .execute() is sync
		const rows = querySync("key_value")
			.where("key", "=", "qsync_foo")
			.selectAll()
			.execute();

		expect(Array.isArray(rows)).toBe(true);
		expect(rows).toHaveLength(1);
		// Raw JSON string semantics (matches executeSync)
		expect(typeof rows[0].value).toBe("string");
		expect(JSON.parse(rows[0].value)).toEqual({ hello: "world" });
	});

	test("supports executeTakeFirst helpers", async () => {
		const lix = await openLix({});
		await lix.db
			.insertInto("key_value")
			.values({ key: "qsync_first", value: "ok" })
			.execute();

		const querySync = createQuerySync({ engine: lix.engine! });

		const row = querySync("key_value")
			.where("key", "=", "qsync_first")
			.selectAll()
			.executeTakeFirst();

		expect(row).toMatchObject({ key: "qsync_first", value: "ok" });

		const rowStrict = querySync("key_value")
			.where("key", "=", "qsync_first")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(rowStrict).toMatchObject({ key: "qsync_first", value: "ok" });
	});

	test("executeTakeFirstOrThrow throws when no result", async () => {
		const lix = await openLix({});
		const querySync = createQuerySync({ engine: lix.engine! });

		expect(() =>
			querySync("key_value")
				.where("key", "=", "does_not_exist")
				.selectAll()
				.executeTakeFirstOrThrow()
		).toThrow();
	});

	test("snapshot_content parsing matches async queries", async () => {
		const lix = await openLix({});

		// Create a file which will write a file descriptor snapshot into state
		const active = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();
		const versionId = active.version_id as unknown as string;

		// Insert via file handler path used by the engine typically
		const file = {
			id: "file_parse_test",
			path: "/a.txt",
			data: new Uint8Array(),
			metadata: {},
			directory_id: null,
			name: "a",
			extension: "txt",
			hidden: false,
		} as any;

		// Use engine helper: write state_all row for file descriptor via Kysely
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: file.id,
				schema_key: "lix_file_descriptor",
				file_id: file.id,
				plugin_key: "lix_own_entity",
				snapshot_content: {
					id: file.id,
					directory_id: file.directory_id,
					name: file.name,
					extension: file.extension,
					metadata: file.metadata,
					hidden: file.hidden,
				},
				schema_version: "1.0",
				version_id: versionId,
				untracked: false,
			})
			.execute();

		// Async Kysely query (normal behavior) – already parsed
		const asyncRow = await lix.db
			.selectFrom("state")
			.where("file_id", "=", file.id)
			.where("schema_key", "=", "lix_file_descriptor")
			.select(["entity_id", "schema_key", "snapshot_content"])
			.executeTakeFirstOrThrow();

		// querySync – should parse snapshot_content identically
		const rowsSync = createQuerySync({ engine: lix.engine! })("state")
			.where("file_id", "=", file.id)
			.where("schema_key", "=", "lix_file_descriptor")
			.select(["entity_id", "schema_key", "snapshot_content"])
			.execute();

		expect(rowsSync).toHaveLength(1);
		const syncRow = rowsSync[0];

		expect(syncRow.snapshot_content).toEqual(asyncRow.snapshot_content);
		expect(typeof syncRow.snapshot_content).toBe("object");
		expect(syncRow.schema_key).toBe("lix_file_descriptor");
	});
});
