import { newLixFile, openLix } from "@lix-js/sdk";
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

export async function lixCsvDemoFile(): Promise<Blob> {
	const lix = await openLix({
		blob: await newLixFile(),
		providePlugins: [csvPlugin],
	});

	if (!import.meta.env.PROD) {
		await lix.db
			.insertInto("file")
			.values({
				id: "sjd9a9-2j2j-minimal",
				metadata: {
					unique_column: "email",
				},
				path: "/minimal.csv",
				data: new TextEncoder().encode(minimalCsv),
			})
			.execute();
	} else {
		// only in production have the demo files been inserted
		// to reduce the number of changes when debugging the app
		await lix.db
			.insertInto("file")
			.values({
				id: DEMO_CAP_TABLE_CSV_FILE_ID,
				path: "/cap-table-example.csv",
				data: new TextEncoder().encode(captableCsv),
				metadata: {
					unique_column: "Stakeholder",
				},
			})
			.execute();

		await lix.db
			.insertInto("file")
			.values({
				id: DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID,
				path: "/email-newsletter.csv",
				data: new TextEncoder().encode(emailNewsletterCsv),
				metadata: {
					unique_column: "email",
				},
			})
			.execute();
	}

	return await lix.toBlob();
}
