import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin as pluginV2 } from "@lix-js/plugin-csv-column-based";
import emailNewsletterCsv from "./email-newsletter.csv?raw";
import captableCsv from "./cap-table.csv?raw";

export const DEMO_CAP_TABLE_CSV_FILE_ID = "29jas9j-2sk2-cap";
export const DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID = "oj20a1-40ss-email";
export const DEMO_FILE_IDS = [
	DEMO_CAP_TABLE_CSV_FILE_ID,
	DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID,
];

export async function lixCsvDemoFile(): Promise<Blob> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [pluginV2],
	});

	// only in production have the demo files been inserted
	// to reduce the number of changes when debugging the app
	if (import.meta.env.PROD) {
		await lix.db
			.insertInto("file")
			.values({
				id: DEMO_CAP_TABLE_CSV_FILE_ID,
				path: "/cap-table-example.csv",
				data: new TextEncoder().encode(captableCsv),
				// @ts-expect-error - insert expects stringified json
				metadata: JSON.stringify({
					unique_column: "Stakeholder",
				}),
			})
			.execute();
	}

	await lix.db
		.insertInto("file")
		.values({
			id: DEMO_EMAIL_NEWSLETTER_CSV_FILE_ID,
			path: "/email-newsletter.csv",
			data: new TextEncoder().encode(emailNewsletterCsv),
			// @ts-expect-error - insert expects stringified json
			metadata: JSON.stringify({
				unique_column: "email",
			}),
		})
		.execute();

	await lix.settled();

	return await lix.toBlob();
}
