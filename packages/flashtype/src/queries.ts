import type { Lix } from "@lix-js/sdk";

// Files
export function selectFiles(lix: Lix) {
	return lix.db
		.selectFrom("file")
		.select(["id", "path"]) // minimal row for explorer
		.orderBy("path", "asc");
}
