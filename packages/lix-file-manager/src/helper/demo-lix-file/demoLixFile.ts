import { changeQueueSettled, newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import emailNewsletterCsv from "./email-newsletter.csv?raw";
import captableCsv from "./cap-table.csv?raw";
import minimalCsv from "./minimal.csv?raw";

export const DEMO_CAP_TABLE_CSV_FILE_ID = "29jas9j-2sk2-cap";
export const DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID = "oj20a1-40ss-email";
export const DEMO_FILE_IDS = [
	DEMO_CAP_TABLE_CSV_FILE_ID,
	DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID,
];

export async function lixCsvDemoFile(lixId: string): Promise<Blob> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [csvPlugin],
	});

	// Store lix_id in database
	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_id",
			value: lixId,
		})
		.execute();

	// Load appropriate demo data based on lixId
	if (lixId === DEMO_CAP_TABLE_CSV_FILE_ID) {
		await lix.db
			.insertInto("file")
			.values({
				id: lixId,
				path: "/cap-table-example.csv",
				data: new TextEncoder().encode(captableCsv),
				metadata: {
					unique_column: "Stakeholder",
				},
			})
			.execute();
	} else if (lixId === DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID) {
		await lix.db
			.insertInto("file")
			.values({
				id: lixId,
				path: "/email-newsletter.csv",
				data: new TextEncoder().encode(emailNewsletterCsv),
				metadata: {
					unique_column: "email",
				},
			})
			.execute();
	} else {
		// New files get minimal demo
		await lix.db
			.insertInto("file")
			.values({
				id: lixId,
				path: "/minimal.csv",
				data: new TextEncoder().encode(minimalCsv),
				metadata: {
					unique_column: "email",
				},
			})
			.execute();
	}

	await changeQueueSettled({ lix });
	return await lix.toBlob();
}
