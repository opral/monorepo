import { Lix } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";

export async function saveLixToOpfs(args: { lix: Lix }) {
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
	const file = await args.lix.toBlob();
	await writable.write(file);
	await writable.close();
	console.log(`done saving lix ${lixId.value} to opfs`);
}
