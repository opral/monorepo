import { Lix } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs";

// Helper function to ensure a lix has a name
export async function ensureLixName({ lix }: { lix: Lix }): Promise<string> {
	// Try to get existing lix name
	const nameRecord = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_name")
		.select("value")
		.executeTakeFirst();

	if (nameRecord?.value) {
		return nameRecord.value;
	}

	// Use "Untitled" as default name
	const defaultName = "Untitled";
	await saveLixName({ lix, newName: defaultName });
	return defaultName;
}

// Helper function to save a lix name
export async function saveLixName({
	lix,
	newName,
}: {
	lix: Lix;
	newName: string;
}): Promise<void> {
	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_name",
			value: newName.trim(),
		})
		.onConflict((oc) => oc.doUpdateSet({ value: newName.trim() }))
		.execute();

	await saveLixToOpfs({ lix });
}
