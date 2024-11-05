import { Lix } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";

export async function saveLixToOpfs(args: { lix: Lix }) {
	const rootHandle = await getOriginPrivateDirectory();
	const fileHandle = await rootHandle.getFileHandle("demo.lix", {
		create: true,
	});
	const writable = await fileHandle.createWritable();
	const file = await args.lix.toBlob();
	await writable.write(file);
	await writable.close();
	console.log("done saving lix to opfs");
}
