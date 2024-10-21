import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import csv from "./cap-table.csv?raw";
import { plugin } from "@lix-js/plugin-csv";

export const DEMO_CAP_TABLE_CSV_FILE_ID = "29jas9j-2sk2-cap";

export async function lixCsvDemoFile(): Promise<Blob> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [plugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: DEMO_CAP_TABLE_CSV_FILE_ID,
			path: "/cap-table-example.csv",
			data: new TextEncoder().encode(csv),
			// @ts-expect-error - insert expects stringified json
			metadata: JSON.stringify({
				unique_column: "Stakeholder",
			}),
		})
		.execute();

	await lix.settled();

	return await lix.toBlob();
}
