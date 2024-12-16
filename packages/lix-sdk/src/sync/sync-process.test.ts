import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import {
	createLsaInMemoryEnvironment,
	createServerApiHandler,
} from "../server-api-handler/index.js";
import { createVersion } from "../version/create-version.js";
import { switchVersion } from "../version/switch-version.js";
import type { Version } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";

test("versions should be synced", async () => {
	const environment = createLsaInMemoryEnvironment();
	const lsaHandler = await createServerApiHandler({ environment });

	global.fetch = vi.fn((request) => lsaHandler(request));

	const lix0 = await openLixInMemory({});

	// @ts-expect-error - eases debugging
	lix0.db.__name = "lix0";

	const lixId = await lix0.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	// initialize lix on the server
	await lsaHandler(
		new Request("http://mock.com/lsa/new-v1", {
			method: "POST",
			body: await lix0.toBlob(),
		})
	);

	// create a second client
	const lix1 = await openLixInMemory({
		blob: await lix0.toBlob(),
	});

	// start syncing
	await lix0.db
		.insertInto("key_value")
		.values({
			key: "lix_server_url",
			value: "http://mock.com",
		})
		.execute();

	await lix1.db
		.insertInto("key_value")
		.values({
			key: "lix_server_url",
			value: "http://mock.com",
		})
		.execute();

	// @ts-expect-error - eases debugging
	lix1.db.__name = "lix1";

	const server = await environment.openLix({ id: lixId.value });

	let version0: Version;

	// lix0 creates and switches to a new version
	await lix0.db.transaction().execute(async (trx) => {
		const currentVersion = await trx
			.selectFrom("current_version")
			.selectAll()
			.executeTakeFirstOrThrow();
		version0 = await createVersion({
			lix: { ...lix0, db: trx },
			parent: currentVersion,
			name: "version0",
		});
		await switchVersion({ lix: { ...lix0, db: trx }, to: version0 });
	});

	// awaiting the polling sync
	await new Promise((resolve) => setTimeout(resolve, 2001));

	// expecting the server to have received the change for the version insert
	const serverChanges = await server.lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("schema_key", "=", "lix_version_table")
		.selectAll()
		.execute();

	expect(serverChanges).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				content: version0!,
			}),
		])
	);

	// expecting both lix0 and lix1 to have the same versions
	const lix0Versions = await lix0.db
		.selectFrom("version")
		.selectAll()
		.execute();

	const lix1Versions = await lix1.db
		.selectFrom("version")
		.selectAll()
		.execute();

	expect(lix0Versions).toEqual(lix1Versions);

	// expecting both lix0 and lix1 to have the same version changes
	const lix0VersionChanges = await lix0.db
		.selectFrom("version_change")
		.orderBy("change_id", "desc")
		.selectAll()
		.execute();

	const lix1VersionChanges = await lix1.db
		.selectFrom("version_change")
		.orderBy("change_id", "desc")
		.selectAll()
		.execute();

	expect(lix0VersionChanges).toEqual(lix1VersionChanges);
});

test("switching synced versions should work", async () => {
	const environment = createLsaInMemoryEnvironment();
	const lsaHandler = await createServerApiHandler({ environment });

	global.fetch = vi.fn((request) => lsaHandler(request));
	// @ts-expect-error - eases debugging
	global.executeSync = executeSync;

	const lix0 = await openLixInMemory({});
	// @ts-expect-error - eases debugging
	lix0.db.__name = "lix0";

	const lixId = await lix0.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const server = await environment.openLix({ id: lixId.value });

	// initialize lix on the server
	await lsaHandler(
		new Request("http://mock.com/lsa/new-v1", {
			method: "POST",
			body: await lix0.toBlob(),
		})
	);

	// set sync server
	await lix0.db
		.insertInto("key_value")
		.values({
			key: "lix_server_url",
			value: "http://mock.com",
		})
		.execute();

	// create a second client
	const lix1 = await openLixInMemory({
		blob: await lix0.toBlob(),
	});

	// @ts-expect-error - eases debugging
	lix1.db.__name = "lix1";

	const currentVersion = await lix0.db
		.selectFrom("current_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// lix0 creates and switches to a new version
	// in which a new change is created that should be
	// synced to lix1
	const version0 = await createVersion({
		lix: lix0,
		name: "version0",
		parent: currentVersion,
	});

	await switchVersion({ lix: lix0, to: version0 });

	await lix0.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock",
		})
		.execute();

	// awaiting the polling sync
	await new Promise((resolve) => setTimeout(resolve, 2004));

	// expecting all changes to be the same across
	// lix0, the server, and lix1
	const keyValueChangesInLix0 = await lix0.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "mock-key")
		.selectAll()
		.execute();

	const keyValueChangesOnServer = await server.lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "mock-key")
		.selectAll()
		.execute();

	const keyValueChangesInLix1 = await lix1.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "mock-key")
		.selectAll()
		.execute();

	expect(keyValueChangesInLix0).toEqual(keyValueChangesOnServer);
	expect(keyValueChangesOnServer).toEqual(keyValueChangesInLix1);

	// switch lix1 to the same version as lix0
	// and expect key value to be mock
	await switchVersion({ lix: lix1, to: version0 });

	const keyValue = await lix1.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirst();

	expect(keyValue).toEqual({
		key: "mock-key",
		value: "mock",
	});
});

test("doesnt sync if #lix_sync is not true", async () => {
	const environment = createLsaInMemoryEnvironment();
	const lsaHandler = await createServerApiHandler({ environment });
	global.fetch = vi.fn((request) => lsaHandler(request));

	const lix = await openLixInMemory({});

	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	// initialize lix on the server
	await lsaHandler(
		new Request("http://mock.com/lsa/new-v1", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	await lix.db
		.updateTable("key_value")
		.set({ value: "false" })
		.where("key", "=", "#lix_sync")
		.execute();

	await lix.db
		.insertInto("key_value")
		.values({ key: "lix_server_url", value: "http://mock.com" })
		.execute();

	await lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.execute();

	const server = await environment.openLix({ id: lixId.value });

	// awaiting the polling sync
	await new Promise((resolve) => setTimeout(resolve, 1010));

	const keyValueChangesOnServer = await server.lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "foo")
		.selectAll()
		.execute();

	expect(keyValueChangesOnServer).toEqual([]);

	// turning sync on

	await lix.db
		.updateTable("key_value")
		.set({ value: "true" })
		.where("key", "=", "#lix_sync")
		.execute();

	await new Promise((resolve) => setTimeout(resolve, 1010));

	const keyValueChangesOnServerAfterSync = await server.lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "foo")
		.selectAll()
		.execute();

	expect(keyValueChangesOnServerAfterSync).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				content: {
					key: "foo",
					value: "bar",
				},
			}),
		])
	);
});