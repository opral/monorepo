import { newLixFile as _newLixFile, openLixInMemory } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs.ts";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

export async function createNewLixFileInOpfs(): Promise<{ id: string }> {
	const lix = await openLixInMemory({
		blob: await _newLixFile(),
		providePlugins: [mdPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await saveLixToOpfs({ lix });

	return { id: id.value };
}
