import { test, expect } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../../lix/plugin-md/dist/index.js";
import { assembleMdAst } from "./assemble-md-ast";
import { insertMarkdownSchemas } from "../../lib/insert-markdown-schemas";

test("assembleMdAst returns empty root when no state root exists", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	await insertMarkdownSchemas({ lix });
	const ast = await assembleMdAst({ lix, fileId: "missing_file" });
	expect(ast).toEqual({ type: "root", children: [] });
});

test("assembleMdAst returns ordered children from state (seeded by plugin)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	await insertMarkdownSchemas({ lix });

	const fileId = "util_file_1";
	const markdown = "Hello";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/util.md",
			data: new TextEncoder().encode(markdown),
		})
		.execute();

	const ast = await assembleMdAst({ lix, fileId });
	expect(ast?.type).toBe("root");
	const children = (ast as any)?.children || [];
	expect(Array.isArray(children)).toBe(true);
	const hasHello = children.some(
		(n: any) =>
			n?.type === "paragraph" &&
			Array.isArray(n.children) &&
			n.children.some((c: any) => c?.type === "text" && c?.value === "Hello"),
	);
	expect(hasHello).toBe(true);
});
