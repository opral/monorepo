import { expect, test, vi } from "vitest";
import { createServerApiHandler } from "../server-api-handler/create-server-api-handler.js";
import { createServerApiMemoryStorage } from "../server-api-handler/storage/create-memory-storage.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { pushToServer } from "./push-to-server.js";
import type { LixFile } from "../database/schema.js";
import type { Account } from "../account/database-schema.js";
import { newLixFile } from "../lix/new-lix.js";
import type { KeyValue } from "../key-value/database-schema.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";

test("push rows of multiple tables to server successfully", async () => {
	const lixBlob = await newLixFile();

	const lix = await openLixInMemory({ blob: lixBlob });

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	const lsaHandler = await createServerApiHandler({ storage });

	global.fetch = vi.fn((request) => lsaHandler(request));

	// initialize the lix on the server
	await lsaHandler(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	// insert an account locally
	await lix.db
		.insertInto("account")
		.values({ id: "account0", name: "some account" })
		.execute();

	// inserting into another table to test if multiple tables are pushed to server
	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock-value",
		})
		.execute();

	await pushToServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
		targetVectorClock: [],
	});

	const lixFromServer = await openLixInMemory({
		blob: await storage.get(`lix-file-${id}`),
	});

	const keyValueOnServer = await lixFromServer.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.execute();

	const accountsOnServer = await lixFromServer.db
		.selectFrom("account")
		.where("id", "=", "account0")
		.selectAll()
		.execute();

	expect(accountsOnServer).toEqual([
		{ id: "account0", name: "some account" } satisfies Account,
	]);
	expect(keyValueOnServer).toEqual([
		{
			key: "mock-key",
			value: "mock-value",
		},
	] satisfies KeyValue[]);
});

test("it should handle snapshots.content json binaries", async () => {
	const lix = await openLixInMemory({});

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	const lsaHandler = await createServerApiHandler({ storage });

	global.fetch = vi.fn((request) => lsaHandler(request));

	// initialize the lix on the server
	await lsaHandler(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	const mockSnapshot = mockJsonSnapshot({
		location: "Berlin",
	});

	// insert a snapshot
	await lix.db
		.insertInto("snapshot")
		.values({
			content: mockSnapshot.content,
		})
		.execute();

	await pushToServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
		targetVectorClock: [],
	});

	const lixFromServer = await openLixInMemory({
		blob: await storage.get(`lix-file-${id}`),
	});

	const snapshot = await lixFromServer.db
		.selectFrom("snapshot")
		.where("id", "=", mockSnapshot.id)
		.selectAll()
		.executeTakeFirst();

	expect(snapshot).toMatchObject(mockSnapshot);
});

test.todo("it should handle binary values", async () => {
	const lixBlob = await newLixFile();

	const lix = await openLixInMemory({ blob: lixBlob });

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	const lsaHandler = await createServerApiHandler({ storage });

	global.fetch = vi.fn((request) => lsaHandler(request));

	// initialize the lix on the server
	await lsaHandler(
		new Request("http://localhost:3000/lsa/new", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	// inserting file with binary data
	await lix.db
		.insertInto("file")
		.values({
			id: "file0",
			path: "/hello.txt",
			data: new TextEncoder().encode("Hello, World!"),
		})
		.execute();

	await pushToServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
		targetVectorClock: [], // initial push - server has no state
	});

	const lixFromServer = await openLixInMemory({
		blob: await storage.get(`lix-file-${id}`),
	});

	const filesOnServer = await lixFromServer.db
		.selectFrom("file")
		.where("id", "=", "file0")
		.selectAll()
		.execute();

	expect(filesOnServer).toEqual([
		{
			id: "file0",
			path: "/hello.txt",
			metadata: null,
			data: new TextEncoder().encode("Hello, World!"),
		} satisfies LixFile,
	]);
});
