import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";

export async function pullFromServer(args: {
	id: string;
	lix: Lix;
	serverUrl: string;
	tableNames: Array<keyof LixDatabaseSchema>;
}): Promise<void> {
	
}
