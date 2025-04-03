import { Lix } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs";

// Helper function to ensure a workspace has a name
export async function ensureWorkspaceName({ lix }: { lix: Lix }): Promise<string> {
	// Try to get existing workspace name
	const nameRecord = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "workspace_name")
		.select("value")
		.executeTakeFirst();

	if (nameRecord?.value) {
		return nameRecord.value;
	}

	// Use "Untitled" as default name
	const defaultName = "Untitled";
	await saveWorkspaceName({ lix, newName: defaultName });
	return defaultName;
}

// Helper function to save a workspace name
export async function saveWorkspaceName({
	lix,
	newName,
}: {
	lix: Lix;
	newName: string;
}): Promise<void> {
	await lix.db
		.insertInto("key_value")
		.values({
			key: "workspace_name",
			value: newName.trim(),
		})
		.onConflict((oc) => oc.doUpdateSet({ value: newName.trim() }))
		.execute();

	await saveLixToOpfs({ lix });
}
