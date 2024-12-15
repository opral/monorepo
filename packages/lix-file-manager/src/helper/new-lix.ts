import { newLixFile as _newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { saveLixToOpfs } from "./saveLixToOpfs.ts";

export async function createNewLixFileInOpfs(): Promise<{ id: string }> {
	const lix = await openLixInMemory({
		blob: await _newLixFile(),
		providePlugins: [csvPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await saveLixToOpfs({ lix });

	return { id: id.value };
}
