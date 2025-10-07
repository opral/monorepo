import type { Lix } from "@lix-js/sdk";

export function selectFilePaths({
	lix,
	limit = 50,
}: {
	lix: Lix;
	limit?: number;
}) {
	return lix.db
		.selectFrom("file")
		.select(["path"])
		.orderBy("path")
		.limit(limit);
}
