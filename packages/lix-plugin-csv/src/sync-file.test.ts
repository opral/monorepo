import { test, expect, vi } from "vitest";
import { changeQueueSettled, executeSync, openLixInMemory } from "@lix-js/sdk";
import {
	createLsaInMemoryEnvironment,
	createServerApiHandler,
} from "@lix-js/sdk";
import { createVersion } from "@lix-js/sdk";
import { switchVersion } from "@lix-js/sdk";
import { plugin as csvPlugin } from "./index.js";

test("switching between versions ", async () => {
	const environment = createLsaInMemoryEnvironment();
	const lsaHandler = await createServerApiHandler({ environment });

	const mockCsvFile = new TextEncoder().encode(
		`email,First name,Last name
rachel@demo.com,Rachel,Booker`,
	) as unknown as ArrayBuffer;

	// @ts-expect-error - eases debugging by querying both lixes in debug steps
	global.executeSync = executeSync;
	global.fetch = vi.fn((request) => lsaHandler(request));

	const lixId = "mock_lix_id";

	const lixA = await openLixInMemory({
		keyValues: [{ key: "lix_id", value: lixId }],
		providePlugins: [csvPlugin],
	});

	// @ts-expect-error - eases debugging
	lixA.db.__name = "lixA";

	const version0 = await createVersion({ lix: lixA, name: "version0" });
	const version1 = await createVersion({ lix: lixA, name: "version1" });

	// initialize lix on the server
	await lsaHandler(
		new Request("http://mock.com/lsa/new-v1", {
			method: "POST",
			body: await lixA.toBlob(),
		}),
	);
	// create a second client
	const lixB = await openLixInMemory({
		blob: await lixA.toBlob(),
		providePlugins: [csvPlugin],
	});
	// @ts-expect-error - eases debugging
	lixB.db.__name = "lixB";

	// ensure that both lixes are in different version
	await switchVersion({ lix: lixA, to: version0 });
	await switchVersion({ lix: lixB, to: version1 });

	// provide the mock server url
	await Promise.all(
		[lixA, lixB].map((lix) =>
			lix.db
				.insertInto("key_value")
				.values({ key: "lix_server_url", value: "http://mock.com" })
				.execute(),
		),
	);

	// turn on sync for both lixes
	await Promise.all(
		[lixA, lixB].map((lix) =>
			lix.db
				.updateTable("key_value")
				.where("key", "=", "#lix_sync")
				.set({ value: "true" })
				.execute(),
		),
	);

	// lix A inserts a csv file in version 0
	await lixA.db
		.insertInto("file")
		.values({
			id: "sjd9a9-2j2j-minimal",
			path: "/email-newsletter.csv",
			data: mockCsvFile,
		})
		.execute();

	await lixA.db
		.updateTable("file")
		.where("id", "=", "sjd9a9-2j2j-minimal")
		.set({
			metadata: {
				unique_column: "email",
			},
		})
		.execute();

	await changeQueueSettled({ lix: lixA });

	// awaiting the polling sync
	await new Promise((resolve) => setTimeout(resolve, 2100));

	// lix B switches to version 0
	// expecting the files of both lixes to match
	await switchVersion({ lix: lixB, to: version0 });

	const [lixAFileTable, lixBFileTable] = await Promise.all(
		[lixA, lixB].map((lix) =>
			lix.db
				.selectFrom("file")
				.orderBy("id", "desc")
				.selectAll()
				.executeTakeFirst(),
		),
	);

	expect(lixAFileTable).toStrictEqual(lixBFileTable);
});
