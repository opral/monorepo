// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { expect, test, vi } from "vitest";
import { createServerProtocolHandler } from "../server-protocol-handler/create-server-protocol-handler.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { pullFromServer } from "./pull-from-server.js";
import { createLspInMemoryEnvironment } from "../server-protocol-handler/environment/create-in-memory-environment.js";
import { toBlob } from "../lix/to-blob.js";

// commented out for lix v0.5
// sync needs overhaul after change set graph introduction
test.skip("pull rows of multiple tables from server successfully and applies them", async () => {
	const lixOnServer = await openLixInMemory({});

	const lix = await openLixInMemory({
		blob: await toBlob({ lix: lixOnServer }),
	});

	const { value: id } = await lixOnServer.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	await lixOnServer.db
		.insertInto("account")
		.values({ id: "account0", name: "test account" })
		.execute();

	await lixOnServer.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock-value",
		})
		.execute();

	// initialize the lix on the server with the mock data
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix: lixOnServer }),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	await pullFromServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
	});

	// Verify the data is pulled into the local lix
	// and applied to the local database
	const account = await lix.db
		.selectFrom("account")
		.where("id", "=", "account0")
		.selectAll()
		.executeTakeFirstOrThrow();

	const mockKey = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(account).toEqual({ id: "account0", name: "test account" });
	expect(mockKey).toMatchObject({ key: "mock-key", value: "mock-value" });
});

test.skip("it handles snapshot.content being json binary", async () => {
	const lixOnServer = await openLixInMemory({});

	const lix = await openLixInMemory({
		blob: await toBlob({ lix: lixOnServer }),
	});

	const { value: id } = await lixOnServer.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	const mockSnapshot = mockJsonSnapshot({
		location: "Berlin",
	});

	// insert mock data into server lix
	await lixOnServer.db
		.insertInto("snapshot")
		.values({
			content: mockSnapshot.content,
		})
		.execute();

	// initialize the lix on the server with the mock data
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix: lixOnServer }),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	await pullFromServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
	});

	// Verify the data is pulled into the local lix
	const snapshots = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", mockSnapshot.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(snapshots).toMatchObject(mockSnapshot);
});

test.skip("rows changed on the client more recently should not be updated", async () => {
	const lixOnServer = await openLixInMemory({});

	const lixId = await lixOnServer.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	await lixOnServer.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock-value-initial",
		})
		.executeTakeFirstOrThrow();

	const lix = await openLixInMemory({
		blob: await toBlob({ lix: lixOnServer }),
	});

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	// initialize the lix on the server with the mock data
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix: lixOnServer }),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	// update the mock data on the client
	await lix.db
		.updateTable("key_value")
		.set({ value: "mock-value-updated" })
		.where("key", "=", "mock-key")
		.execute();

	await pullFromServer({
		id: lixId.value,
		lix,
		serverUrl: "http://localhost:3000",
	});

	// verify data on client
	const mockKey = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockKey).toMatchObject({
		key: "mock-key",
		value: "mock-value-updated",
	});
});

// the change table now models "change control". no more last edit wins needed
test.skip("rows changed on the server more recently should be updated on the client", async () => {
	// setup mock server
	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	// create a lix and clone it for the client - so they share the same lix id
	const remoteLix = await openLixInMemory({});
	const localLix = await openLixInMemory({
		blob: await toBlob({ lix: remoteLix }),
	});

	// insert mock data into server lix
	await remoteLix.db
		.insertInto("account")
		.values({ id: "account0", name: "test account" })
		.execute();

	await remoteLix.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock-value",
		})
		.execute();

	// let the wall clock move one ms forward
	await new Promise((resolve) => setTimeout(resolve, 1));

	// insert conflicting mock data into local lix
	await localLix.db
		.insertInto("account")
		.values({
			id: "account0",
			name: "test account updated more recently on client",
		})
		.execute();

	// let the wall clock move one ms forward
	await new Promise((resolve) => setTimeout(resolve, 1));

	// update the conflicting mock data on the server as well
	await remoteLix.db
		.updateTable("account")
		.set({ name: "test account updated more recently on the server" })
		.where("account.id", "=", "account0")
		.execute();

	// initialize the lix on the server with the mock data
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix: remoteLix }),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	const { value: id } = await localLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	await pullFromServer({
		id,
		lix: localLix,
		serverUrl: "http://localhost:3000",
	});

	// Verify the data is pulled into the local lix
	const account = await localLix.db
		.selectFrom("account")
		.where("id", "=", "account0")
		.selectAll()
		.executeTakeFirstOrThrow();

	// TODO we don't sync tables without row id atm
	// const mockKey = await lix.db
	// 	.selectFrom("key_value")
	// 	.where("key", "=", "mock-key")
	// 	.selectAll()
	// 	.executeTakeFirstOrThrow();

	expect(account).toEqual({
		id: "account0",
		name: "test account updated more recently on the server",
	});

	const mockKey = await localLix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockKey).toEqual({ key: "mock-key", value: "mock-value" });
});

// test.skip("it should handle files without syncing the data column", async () => {
// 	const lix = await openLixInMemory({});

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
// 		new Request("http://localhost:3000/lsp/new", {
// 			method: "POST",
// 			body: await lix.toBlob(),
// 		})
// 	);

// 	// Insert mock file data into the server's environment
// 	await environment.executeSql(
// 		"INSERT INTO file (id, path, data, metadata) VALUES ('file0', '/path.txt', ?, 'mock-metadata')",
// 		[new TextEncoder().encode("Hello, World!")]
// 	);

// 	await pullFromServer({
// 		id,
// 		lix,
// 		serverUrl: "http://localhost:3000",
// 		tableNames: ["file"],
// 	});

// 	// Verify the data is pulled into the local database without the `data` column
// 	const filesInDb = await lix.db.selectFrom("file").selectAll().execute();

// 	expect(filesInDb).toEqual([
// 		{
// 			id: "file0",
// 			path: "/path.txt",
// 			metadata: "mock-metadata",
// 		},
// 	]);
// });

// commented out for lix v0.5
// sync needs overhaul after change set graph introduction
test.skip("non-conflicting changes from the server should for the same version should be applied", async () => {
	const lix = await openLixInMemory({});

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	global.fetch = vi.fn((request) => lspHandler(request));

	const lixOnServer = await openLixInMemory({ blob: await toBlob({ lix }) });

	// insert data on the server that the client does not have yet
	await lixOnServer.db
		.insertInto("key_value")
		.values({ key: "mock-key", value: "mock-value" })
		.execute();

	const serverVersionChanges = await lixOnServer.db
		.selectFrom("version_change")
		.innerJoin("change", "version_change.change_id", "change.id")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("version_id", "=", currentVersion.id)
		.selectAll("version_change")
		.select("snapshot.content as content")
		.execute();

	// the server should have the change we just made
	expect(serverVersionChanges).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				version_id: currentVersion.id,
				content: expect.objectContaining({
					key: "mock-key",
					value: "mock-value",
				}),
			}),
		])
	);

	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix: lixOnServer }),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	await pullFromServer({
		id: lixId.value,
		lix,
		serverUrl: "http://localhost:3000",
	});

	const mockKey = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirst();

	const versionChanges = await lix.db
		.selectFrom("version_change")
		.innerJoin("change", "version_change.change_id", "change.id")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("version_id", "=", currentVersion.id)
		.selectAll("version_change")
		.select("snapshot.content as content")
		.execute();

	expect(mockKey).toMatchObject({ key: "mock-key", value: "mock-value" });
	expect(versionChanges).toEqual(expect.arrayContaining(serverVersionChanges));
});
