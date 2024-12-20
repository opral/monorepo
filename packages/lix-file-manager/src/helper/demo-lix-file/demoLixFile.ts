import {
	fileQueueSettled,
	newLixFile,
	openLixInMemory,
	toBlob,
} from "@lix-js/sdk";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import emailNewsletterCsv from "./email-newsletter.csv?raw";
import minimalCsv from "./minimal.csv?raw";

export async function lixCsvDemoFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [csvPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	if (import.meta.env.PROD) {
		await lix.db
			.insertInto("file")
			.values({
				path: "/email-newsletter.csv",
				data: new TextEncoder().encode(emailNewsletterCsv),
				metadata: {
					unique_column: "email",
				},
			})
			.execute();
	} else {
		// New files get minimal demo csv for development purposes
		await lix.db
			.insertInto("file")
			.values({
				path: "/minimal.csv",
				data: new TextEncoder().encode(minimalCsv),
				metadata: {
					unique_column: "email",
				},
			})
			.execute();
	}

	await fileQueueSettled({ lix });
	return { blob: await toBlob({ lix }), id: id.value };
}
