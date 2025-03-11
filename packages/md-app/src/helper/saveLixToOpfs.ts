import { Lix, toBlob } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { getDefaultStore } from "jotai";
import { withPollingAtom } from "@/state";

export async function saveLixToOpfs(args: { lix: Lix }) {
	const store = getDefaultStore();

	const lixId = await args.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	const rootHandle = await getOriginPrivateDirectory();
	const fileHandle = await rootHandle.getFileHandle(`${lixId.value}.lix`, {
		create: true,
	});
	const writable = await fileHandle.createWritable();
	const file = await toBlob({ lix: args.lix });
	await writable.write(file);
	await writable.close();

	store.set(withPollingAtom, Date.now());

	console.log(`done saving lix ${lixId.value} to opfs`);
}
