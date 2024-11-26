import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";

export async function fetchRowsFromServer(args: {
	serverUrl: string;
	lix: Lix;
	id: string;
	tableNames: Array<keyof LixDatabaseSchema>;
}): Promise<void> {
	return;
}
