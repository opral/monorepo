import { expect, test } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { newLixFile } from "./new-lix.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { toBlob } from "./to-blob.js";
import { usedFileExtensions } from "./open-lix.js";
import type { Account } from "../account/schema.js";

test("providing plugins should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});
	expect(await lix.plugin.getAll()).toContain(mockPlugin);
});

test("providing key values should be possible", async () => {
	const lix = await openLixInMemory({
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
	const lix1 = await openLixInMemory({
		blob: await toBlob({ lix }),
		keyValues: [{ key: "mock_key", value: "value2" }],
	});

	const value1 = await lix1.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "mock_key")

		.executeTakeFirstOrThrow();
	expect(value1).toMatchObject({ key: "mock_key", value: "value2" });
});

test("providing an account should be possible", async () => {
	const mockAccount: Account = {
		id: "mock-account",
		name: "peter",
	};

	const lix = await openLixInMemory({
		account: mockAccount,
		blob: await newLixFile(),
	});

	const accounts = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(accounts, "to be the provided account").toContainEqual(mockAccount);
	expect(accounts, "no other active account is inserted").lengthOf(1);
});

test("usedFileExtensions", async () => {
	const lix = await openLixInMemory({
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
