import { parse } from 'svelte/compiler'

type Ast = ReturnType<typeof parse>

// @ts-ignore
export const markupToAst = (markup: string) => parse(markup)

export const wrapMarkupChildren = (ast: Ast, wrapWith: Ast) => {
	// TODO: implement
}
