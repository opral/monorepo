import type { parse } from "svelte/compiler"

export type Ast = ReturnType<typeof parse>
export type TemplateNode = Ast["html"]

export type ElementNode<Name extends stirng> = {
	start: number
	end: number
	type: "Element"
	name: Name
	attributes: Attribute<any>[]
}

export type Attribute<Name extends string> = {
	start: number
	end: number
	name: Name
	value: AttributeValue[]
}

export type AttributeValue =
	| {
			start: number
			end: number
			type: "Text"
			raw: string
			data: string
	  }
	| {
			start: number
			end: number
			type: "MustacheTag"
			expression: {
				start: number
				end: number
			}
	  }
