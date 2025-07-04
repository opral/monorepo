import { newLixFile as _newLixFile, openLix } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs.ts";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";

export async function createNewLixFileInOpfs(): Promise<{ id: string }> {
	const lix = await openLix({
		blob: await _newLixFile(),
		providePlugins: [txtPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await saveLixToOpfs({ lix });

	return { id: id.value };
}
