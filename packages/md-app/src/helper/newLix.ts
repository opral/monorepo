import { newLixFile, openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../lix/plugin-md/dist";

export async function createNewLixFileInOpfs(): Promise<{ id: string }> {
	const lixFile = await newLixFile();
	await openLix({
		blob: lixFile,
		providePlugins: [mdPlugin],
		storage: new OpfsStorage({ path: `${lixFile._lix.id}.lix` }),
	});

	return { id: lixFile._lix.id };
}
