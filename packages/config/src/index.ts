import { createAst } from "@inlang/ast";

export function hello(x: string): string {
	return createAst(x);
}
