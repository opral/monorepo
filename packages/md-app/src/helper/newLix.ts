import { newLixFile as _newLixFile, openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

export async function createNewLixFileInOpfs(): Promise<{ id: string }> {
	const lix = await openLix({
		blob: await _newLixFile(),
		providePlugins: [mdPlugin],
		storage: new OpfsStorage({ path: "Untitled.lix" }),
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	return { id: id.value };
}
