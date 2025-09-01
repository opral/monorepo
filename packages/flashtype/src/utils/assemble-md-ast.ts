import type { Lix } from "@lix-js/sdk";
import { AstSchemas } from "@opral/markdown-wc";

/**
 * Assemble a markdown AST for a file from Lix state.
 *
 * This function reconstructs the current document AST using the markdown plugin’s
 * persisted snapshots in the `state` table. It reads the root order entity
 * (`markdown_wc_root_order`) to determine the top‑level block ordering and then
 * fetches each block’s latest snapshot. The returned AST preserves each block’s
 * `data.id`, ensuring stable identities across editor (re)mounts and renders.
 *
 * Assumptions/Notes:
 * - The markdown plugin (e.g. `plugin_md`) is registered with the Lix instance so
 *   that inserting a file seeds the initial state (root order + first blocks).
 * - If there’s no root order in state (e.g. brand new file with no content), an
 *   empty root (`{ type: 'root', children: [] }`) is returned.
 * - Only top‑level blocks are reconstructed; nested inline structure is stored in
 *   each snapshot’s `children` and returned as‑is.
 *
 * @param args.lix - Open Lix instance used to query state
 * @param args.fileId - The file id whose AST should be assembled
 * @returns A markdown AST `{ type: 'root', children }` built from state
 *
 * @example
 * const ast = await assembleMdAst({ lix, fileId: "file_123" });
 * // ast.type === 'root'; ast.children ordered per root order
 */
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
