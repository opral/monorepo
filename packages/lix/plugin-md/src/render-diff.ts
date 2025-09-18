import { serializeToHtml } from "@opral/markdown-wc/html";
import { renderHtmlDiff } from "@lix-js/html-diff";
import { AstSchemas, type MarkdownNode, type Ast } from "@opral/markdown-wc";
import type { RenderDiffArgs } from "@lix-js/sdk";

async function buildAstFromDiffs(
	diffs: RenderDiffArgs["diffs"],
	which: "before" | "after",
): Promise<Ast> {
	const rootKey = AstSchemas.RootOrderSchema["x-lix-key"] as string;
	const orderDiff = diffs.find((d) => d.schema_key === rootKey);
	const order: string[] =
		(orderDiff as any)?.[`${which}_snapshot_content`]?.order ?? [];

	const nodes = new Map<string, MarkdownNode>();
	for (const diff of diffs) {
		if (diff.schema_key === rootKey) continue;
		const snapshot = diff[`${which}_snapshot_content` as const];
		if (snapshot)
			nodes.set(diff.entity_id, snapshot as unknown as MarkdownNode);
	}

	const combined = Array.from(new Set<string>([...order, ...nodes.keys()]));
	const children: MarkdownNode[] = [];
	for (const id of combined) {
		const node = nodes.get(id);
		if (node) children.push(node);
	}

	return { type: "root", children };
}

export async function renderDiff(args: RenderDiffArgs): Promise<string> {
	const beforeAst = await buildAstFromDiffs(args.diffs, "before");
	const afterAst = await buildAstFromDiffs(args.diffs, "after");

	const serialize = serializeToHtml as unknown as (
		ast: Ast,
		options?: { diffHints?: boolean },
	) => Promise<string>;

	const [beforeHtml, afterHtml] = await Promise.all([
		serialize(beforeAst, { diffHints: true }),
		serialize(afterAst, { diffHints: true }),
	]);

	return renderHtmlDiff({
		beforeHtml,
		afterHtml,
		diffAttribute: "data-id",
	});
}
