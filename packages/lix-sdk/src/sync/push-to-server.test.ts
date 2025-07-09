import { expect, test, vi } from "vitest";
import { createServerProtocolHandler } from "../server-protocol-handler/create-server-protocol-handler.js";
import { openLix } from "../lix/open-lix.js";
import { pushToServer } from "./push-to-server.js";
import { newLixFile } from "../lix/new-lix.js";
import { pullFromServer } from "./pull-from-server.js";
import { createLspInMemoryEnvironment } from "../server-protocol-handler/environment/create-in-memory-environment.js";
import type { LixKeyValue } from "../key-value/schema.js";
import type { LixAccount } from "../account/schema.js";

test.skip("push rows of multiple tables to server successfully", async () => {
	const lixBlob = await newLixFile();

	const lix = await openLix({ blob: lixBlob });

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	// initialize the lix on the server
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

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

	// change control of own tables
	// is async atm, need to await here
	// see https://linear.app/opral/issue/LIXDK-263/sync-execution-of-queries
	await new Promise((resolve) => setTimeout(resolve, 100));

	await pushToServer({
		id: id.value,
		lix,
		serverUrl: "http://localhost:3000",
		// empty vector clock means push all rows
		targetVectorClock: [],
	});

	const openOnServer = await environment.openLix({ id: id.value });

	const keyValueChangesOnServer = await openOnServer.lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "mock-key")
		.selectAll()
		.execute();

	const accountsChangesOnServer = await openOnServer.lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_account_table")
		.where("entity_id", "=", "account0")
		.selectAll()
		.execute();

	expect(accountsChangesOnServer.map((c) => c.snapshot_content)).toEqual([
		{ id: "account0", name: "some account" } satisfies LixAccount,
	]);
	expect(keyValueChangesOnServer.map((c) => c.snapshot_content)).toEqual([
		expect.objectContaining({
			key: "mock-key",
			value: "mock-value",
		}),
	] satisfies LixAccount[]);
});

// commented out for lix v0.5
// sync needs overhaul after change set graph introduction
test.skip("push-pull-push with two clients", async () => {
	const lixBlob = await newLixFile();

	const client1 = await openLix({ blob: lixBlob });
	const client2 = await openLix({ blob: lixBlob });

	const { value: lixId } = await client1.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	// Initialize the lix on the server
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await client1.toBlob(),
		})
	);

	// Client 1 inserts an account locally
	await client1.db
		.insertInto("account")
		.values({ id: "account0", name: "account from client 1" })
		.execute();

	// Client 1 inserts into another table
	await client1.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock-value from client 1",
		})
		.execute();

	// Client 1 pushes to server
	await pushToServer({
		id: lixId,
		lix: client1,
		serverUrl: "http://localhost:3000",
		targetVectorClock: [],
	});

	// Client 2 pulls from server
	const knownServerStateClient2 = await pullFromServer({
		id: lixId,
		lix: client2,
		serverUrl: "http://localhost:3000",
	});

	// expect client2 to have the same data as client1
	// after pulling from the server
	const client2AccountAfterPull = await client2.db
		.selectFrom("account")
		.selectAll()
		.execute();

	const client2KeyValueAfterPull = await client2.db
		.selectFrom("key_value")
		.selectAll()
		.execute();

	expect(client2AccountAfterPull).toEqual(
		expect.arrayContaining([
			{ id: "account0", name: "account from client 1" } satisfies LixAccount,
		])
	);

	expect(client2KeyValueAfterPull).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				key: "mock-key",
				value: "mock-value from client 1",
			} satisfies LixKeyValue),
		])
	);

	// Client 2 inserts an account locally
	await client2.db
		.insertInto("account")
		.values({ id: "account1", name: "account from client 2" })
		.execute();

	// Client 2 inserts into another table
	await client2.db
		.insertInto("key_value")
		.values({
			key: "mock-key-2",
			value: "mock-value from client 2",
		})
		.execute();

	await client2.db
		.updateTable("key_value")
		.set({
			value: "mock-value from client 1 - updated by client 2",
		})
		.where("key", "=", "mock-key")
		.execute();

	// Client 2 pushes to server
	await pushToServer({
		id: lixId,
		lix: client2,
		serverUrl: "http://localhost:3000",
		targetVectorClock: knownServerStateClient2,
	});

	// Verify the data on the server
	const openOnServer = await environment.openLix({ id: lixId });

	const accountsChangesOnServer = await openOnServer.lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_account_table")
		.selectAll()
		.execute();

	expect(accountsChangesOnServer.map((c) => c.snapshot_content)).toEqual(
		expect.arrayContaining([
			{ id: "account0", name: "account from client 1" },
			{ id: "account1", name: "account from client 2" },
		])
	);

	await pullFromServer({
		id: lixId,
		lix: client1,
		serverUrl: "http://localhost:3000",
	});

	const accountChangesOnClient1 = await client1.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_account_table")
		.selectAll()
		.execute();

	// TODO @samuel  - this seem to be broken because of asynchronous change managment ? how shall we test this?
	expect(accountsChangesOnServer).toEqual(accountChangesOnClient1);

	await pullFromServer({
		id: lixId,
		lix: client2,
		serverUrl: "http://localhost:3000",
	});

	const accountChangesOnClient2 = await client2.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_account_table")
		.selectAll()
		.execute();

	expect(accountsChangesOnServer).toEqual(accountChangesOnClient2);

	const keyValueChangesOnServer = await openOnServer.lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	expect(keyValueChangesOnServer.map((c) => c.snapshot_content)).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				key: "mock-key",
				value: "mock-value from client 1",
			}),
			expect.objectContaining({
				key: "mock-key",
				value: "mock-value from client 1 - updated by client 2",
			}),
			expect.objectContaining({
				key: "mock-key-2",
				value: "mock-value from client 2",
			}),
		])
	);
});

// test.skip("it should handle snapshots.content json binaries", async () => {
// 	const lix = await openLix({});

// 	const { value: id } = await lix.db
// 		.selectFrom("key_value")
// 		.where("key", "=", "lix_id")
// 		.selectAll()
// 		.executeTakeFirstOrThrow();

// 	const environment = createLspInMemoryEnvironment();
// 	const lspHandler = await createServerProtocolHandler({ environment });

// 	global.fetch = vi.fn((request) => lspHandler(request));

// 	// initialize the lix on the server
// 	await lspHandler(
// 		new Request("http://localhost:3000/lsp/new-v1", {
// 			method: "POST",
// 			body: await lix.toBlob(),
// 		})
// 	);

// 	const mockSnapshot = {
// 		id: "snapshot0",
// 		content: {
// 			location: "Berlin",
// 		},
// 	};

// 	// insert a snapshot
// 	await lix.db
// 		.insertInto("snapshot")
// 		.values({
// 			content: mockSnapshot.content,
// 		})
// 		.execute();

// 	await pushToServer({
// 		id,
// 		lix,
// 		serverUrl: "http://localhost:3000",
// 		targetVectorClock: [],
// 	});

// 	const openOnServer = await environment.openLix({ id });

// 	const snapshot = await openOnServer.lix.db
// 		.selectFrom("snapshot")
// 		.where("id", "=", mockSnapshot.id)
// 		.selectAll()
// 		.executeTakeFirst();

// 	expect(snapshot).toMatchObject(mockSnapshot);
// });

test.todo("it should handle binary values", async () => {
	const lixBlob = await newLixFile();

	const lix = await openLix({ blob: lixBlob });

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	// initialize the lix on the server
	await lspHandler(
		new Request("http://localhost:3000/lsp/new", {
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

	const lixFromServer = await openLix({
		blob: await environment.getLix({ id }),
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
		},
	]);
});
