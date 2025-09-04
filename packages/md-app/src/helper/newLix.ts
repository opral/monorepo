import { newLixFile, openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

export async function createNewLixFileInOpfs(): Promise<{ id: string }> {
	const lixFile = await newLixFile();
	await openLix({
		blob: lixFile,
		providePlugins: [mdPlugin],
    storage: OpfsStorage.byId(lixFile._lix.id),
	});

	return { id: lixFile._lix.id };
}
