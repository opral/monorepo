import type { parse } from "svelte/compiler"

export type Ast = ReturnType<typeof parse>
export type TemplateNode = Ast["html"]

export type LinkElement = {
	start: number
	end: number
	attributes: Attribute[]
	name: string
}

export type Attribute = {
	start: number
	end: number
	name: string
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
