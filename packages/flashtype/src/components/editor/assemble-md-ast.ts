import type { Lix } from "@lix-js/sdk";
import { AstSchemas } from "@opral/markdown-wc";

export async function assembleMdAst(args: {
	lix: Lix;
	fileId: string | null | undefined;
}): Promise<any> {
	const { lix, fileId } = args;
	if (!fileId) return { type: "root", children: [] } as any;

	const rootKey = (AstSchemas.RootOrderSchema as any)["x-lix-key"] as string;
	const root = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId as any)
		.where("schema_key", "=", rootKey)
		.select(["snapshot_content"]) // { order }
		.executeTakeFirst();

	const order: string[] = Array.isArray((root as any)?.snapshot_content?.order)
		? ((root as any).snapshot_content.order as string[])
		: [];
	if (!order.length) return { type: "root", children: [] } as any;

	const nodes = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId as any)
		.select(["entity_id", "schema_key", "snapshot_content"]) // top-level blocks
		.execute();

	const byId = new Map<string, any>();
	for (const r of nodes)
		byId.set((r as any).entity_id, (r as any).snapshot_content);

	const children: any[] = [];
	for (const id of order) {
		const n = byId.get(id);
		if (n) children.push(n);
	}

	return { type: "root", children } as any;
}
