import { test, expect } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md-v2";
import { assembleMdAst } from "./assemble-md-ast";

test("assembleMdAst returns empty root when no state root exists", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const ast = await assembleMdAst({ lix, fileId: "missing_file" });
	expect(ast).toEqual({ type: "root", children: [] });
});

test("assembleMdAst returns ordered children from state (seeded by plugin)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });

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

	// The md plugin populates state on file insert; assemble AST from state
	const ast = await assembleMdAst({ lix, fileId });
	expect(ast?.type).toBe("root");
	const children = (ast as any)?.children || [];
	expect(Array.isArray(children)).toBe(true);
	// Look for a paragraph with text "Hello"
	const hasHello = children.some(
		(n: any) =>
			n?.type === "paragraph" &&
			Array.isArray(n.children) &&
			n.children.some((c: any) => c?.type === "text" && c?.value === "Hello"),
	);
	expect(hasHello).toBe(true);
});
