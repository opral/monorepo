import { test, expect, vi } from "vitest";
import { openLixInMemory } from "@lix-js/sdk";
import {
	createLsaInMemoryEnvironment,
	createServerApiHandler,
} from "@lix-js/sdk";
import { createVersion } from "@lix-js/sdk";
import { switchVersion } from "@lix-js/sdk";
import type { Version } from "@lix-js/sdk";
import { plugin as csvPlugin } from "./index.js";

test("a file without unique id should  be synced", async () => {
	const environment = createLsaInMemoryEnvironment();
	const lsaHandler = await createServerApiHandler({ environment });

	const mockCsvFile = new TextEncoder().encode(
		`email;First name;Last name
rachel@demo.com;Rachel;Booker
peter.n@moon.mail;Peter;Newman
anna@post.de;Anna;Jakob`,
	) as unknown as ArrayBuffer;

	global.fetch = vi.fn((request) => lsaHandler(request));

	const lix0 = await openLixInMemory({
		keyValues: [{ key: "#lix_sync", value: "true" }],
		providePlugins: [csvPlugin],
	});

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
		}),
	);

	// create a second client
	const lix1 = await openLixInMemory({
		blob: await lix0.toBlob(),
		keyValues: [{ key: "#lix_sync", value: "true" }],
		providePlugins: [csvPlugin],
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
		]),
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

	// add csv file to lix0
	await lix0.db
		.insertInto("file")
		.values({
			id: "sjd9a9-2j2j-minimal",

			path: "/email-newsletter.csv",
			data: mockCsvFile,
		})
		.execute();

	// awaiting the polling sync
	await new Promise((resolve) => setTimeout(resolve, 2001));

	const lix0FileTable = await lix0.db
		.selectFrom("file")
		.orderBy("id", "desc")
		.selectAll()
		.execute();

	const lix1FileTable = await lix1.db
		.selectFrom("file")
		.orderBy("id", "desc")
		.selectAll()
		.execute();

	const lixServerFileTable = await server.lix.db
		.selectFrom("file")
		.orderBy("id", "desc")
		.selectAll()
		.execute();

	// expecting the server to have received the change for the version insert
	const serverChangesWithFile = await server.lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("schema_key", "=", "lix_file_table")
		.selectAll()
		.execute();

	expect(lix1FileTable).toEqual(lix0FileTable);

	expect(serverChangesWithFile).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				content: version0!,
			}),
		]),
	);
});
