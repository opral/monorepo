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
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
		blob: await newLixFile(),
	});

	const lixCopy = await openLix({
		blob: await lix.toBlob(),
	});

	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	await lixCopy.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	const lixState = await lix.db.selectFrom("state").selectAll().execute();

	const lixCopyState = await lixCopy.db
		.selectFrom("state")
		.selectAll()
		.execute();

	expect(lixState).toEqual(lixCopyState);
});