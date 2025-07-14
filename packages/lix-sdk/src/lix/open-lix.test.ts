import { expect, test } from "vitest";
import { newLixFile } from "./new-lix.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { openLix, usedFileExtensions } from "./open-lix.js";
import type { LixAccount } from "../account/schema.js";

test("providing plugins should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
	};
	const lix = await openLix({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});
	expect(await lix.plugin.getAll()).toContain(mockPlugin);
});

test("providing key values should be possible", async () => {
	const lix = await openLix({
		blob: await newLixFile(),
		keyValues: [{ key: "mock_key", value: "value" }],
	});

	const value = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "mock_key")
		.executeTakeFirstOrThrow();

	expect(value).toMatchObject({ key: "mock_key", value: "value" });

	// testing overwriting key values
	const lix1 = await openLix({
		blob: await lix.toBlob(),
		keyValues: [{ key: "mock_key", value: "value2" }],
	});

	const value1 = await lix1.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "mock_key")

		.executeTakeFirstOrThrow();
	expect(value1).toMatchObject({ key: "mock_key", value: "value2" });
});

test("provided key values in openLix should default to the active version if lixcol_version_id is not specified", async () => {
	const lix = await openLix({
		blob: await newLixFile(),
		keyValues: [
			{ key: "test_key_1", value: "test_value_1" },
			{ key: "test_key_2", value: "test_value_2", lixcol_version_id: "global" },
		],
	});

	// Get the active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirst();

	expect(activeVersion).toBeDefined();
	expect(activeVersion?.version_id).toBeDefined();

	// Check that test_key_1 without lixcol_version_id is associated with the active version
	const kv1 = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "test_key_1")
		.selectAll()
		.executeTakeFirst();

	expect(kv1?.value).toBe("test_value_1");
	expect(kv1?.lixcol_version_id).toBe(activeVersion?.version_id);

	// Check that test_key_2 with explicit lixcol_version_id is associated with the global version
	const kv2 = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "test_key_2")
		.selectAll()
		.executeTakeFirst();

	expect(kv2?.value).toBe("test_value_2");
	expect(kv2?.lixcol_version_id).toBe("global");

	// The active version should be "main" (not "global")
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", activeVersion!.version_id)
		.selectAll()
		.executeTakeFirst();

	expect(mainVersion?.name).toBe("main");
});

// TODO occasional test failures due to timing issues
// faulty state materialization might be the cause.
// fix after https://github.com/opral/lix-sdk/issues/308
test("providing an account should be possible", async () => {
	const mockAccount: LixAccount = {
		id: "mock-account",
		name: "peter",
	};

	const lix = await openLix({
		account: mockAccount,
		blob: await newLixFile(),
	});

	const accounts = await lix.db
		.selectFrom("active_account")
		.select(["id", "name"])
		.execute();

	expect(accounts, "to be the provided account").toContainEqual(mockAccount);
	expect(
		accounts,
		"no other active account exists except for the provided one"
	).lengthOf(1);
});

test("usedFileExtensions", async () => {
	const lix = await openLix({
		blob: await newLixFile(),
	});
	await lix.db
		.insertInto("file")
		.values([
			{
				path: "/test.txt",
				data: new Uint8Array(),
			},
			{
				path: "/test2.txt",
				data: new Uint8Array(),
			},
			{
				path: "/folder/folderwithdot./doc.pdf",
				data: new Uint8Array(),
			},
		])
		.execute();

	const extensions = await usedFileExtensions(lix.db);
	expect(new Set(extensions)).toEqual(new Set(["txt", "pdf"]));
});

test("it should open a lix in memory from a blob", async () => {
	const lix1 = await openLix({});

	await lix1.db
		.insertInto("file")
		.values({
			id: "1",
			path: "/a.txt",
			data: new TextEncoder().encode("hello"),
		})
		.execute();

	const lix2 = await openLix({ blob: await lix1.toBlob() });
	const files = await lix2.db.selectFrom("file").selectAll().execute();

	expect(files).toEqual([
		expect.objectContaining({
			id: "1",
			path: "/a.txt",
			data: new TextEncoder().encode("hello"),
		}),
	]);
});

test("should default to InMemoryStorage when no storage is provided", async () => {
	const lix = await openLix({});

	// Should create a valid lix with new data
	const lixId = await lix.db
		.selectFrom("key_value")
		.select("value")
		.where("key", "=", "lix_id")
		.executeTakeFirstOrThrow();

	expect(lixId.value).toBeDefined();
	expect(typeof lixId.value).toBe("string");

	// Should be able to add and query data
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file",
			path: "/test.txt",
			data: new TextEncoder().encode("test content"),
		})
		.execute();

	const files = await lix.db.selectFrom("file").selectAll().execute();
	expect(files).toHaveLength(1);
	expect(files[0]).toMatchObject({
		id: "test-file",
		path: "/test.txt",
		data: new TextEncoder().encode("test content"),
	});
});

test("providing lix_deterministic_mode = true should lead to deterministic state", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
		blob: await newLixFile(),
	});

	const lix2 = await openLix({
		blob: await lix1.toBlob(),
	});

	await lix1.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	await lix2.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	const lix1State = await lix1.db.selectFrom("state").selectAll().execute();

	const lix2State = await lix2.db.selectFrom("state").selectAll().execute();

	expect(lix1State).toEqual(lix2State);
});

test("deterministic mode can be turned on and off", async () => {
	const lix1 = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: true,
				lixcol_version_id: "global",
			},
		],
		blob: await newLixFile(),
	});

	const lix2 = await openLix({
		blob: await lix1.toBlob(),
	});

	await Promise.all(
		[lix1, lix2].map(async (lix) => {
			await lix.db
				.insertInto("key_value")
				.values({
					key: "test_key",
					value: "test_value",
				})
				.execute();
		})
	);

	const lix1State = await lix1.db.selectFrom("state").selectAll().execute();

	const lix2State = await lix2.db.selectFrom("state").selectAll().execute();

	expect(lix1State).toEqual(lix2State);

	// now turning off deterministic mode and insert a new key value

	await Promise.all(
		[lix1, lix2].map(async (lix) => {
			await lix.db
				.updateTable("key_value_all")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_deterministic_mode")
				.set({ value: false })
				.execute();
		})
	);

	await Promise.all(
		[lix1, lix2].map(async (lix) => {
			await lix.db
				.insertInto("key_value")
				.values({
					key: "test_key_2",
					value: "test_value_2",
				})
				.execute();
		})
	);

	const [lix1Kv, lix2Kv] = await Promise.all(
		[lix1, lix2].map((lix) =>
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "test_key_2")
				.selectAll()
				.execute()
		)
	);

	// the change ids etc should be different given that deterministic mode was turned off
	expect(lix1Kv).not.toEqual(lix2Kv);

	// turn on deterministic mode again and insert a new key value

	await Promise.all(
		[lix1, lix2].map(async (lix) => {
			await lix.db
				.updateTable("key_value_all")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_deterministic_mode")
				.set({ value: true })
				.execute();
		})
	);

	await Promise.all(
		[lix1, lix2].map(async (lix) => {
			await lix.db
				.insertInto("key_value")
				.values({
					key: "test_key_3",
					value: "test_value_3",
				})
				.execute();
		})
	);

	const [lix1Kv2, lix2Kv2] = await Promise.all(
		[lix1, lix2].map((lix) =>
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "test_key_3")
				.selectAll()
				.executeTakeFirst()
		)
	);

	// the change ids etc should be the same given that deterministic mode was turned on again
	expect(lix1Kv2).toEqual(lix2Kv2);
});