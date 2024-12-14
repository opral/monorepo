import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import {
	createLsaInMemoryEnvironment,
	createServerApiHandler,
} from "../server-api-handler/index.js";
import { createVersion } from "../version/create-version.js";
import { switchVersion } from "../version/switch-version.js";
import type { Version } from "../database/schema.js";

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

	// start syncing
	await lix0.db
		.insertInto("key_value")
		.values({
			key: "lix_experimental_server_url",
			value: "http://mock.com",
		})
		.execute();

	// create a second client
	const lix1 = await openLixInMemory({
		blob: await lix0.toBlob(),
	});

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
});
