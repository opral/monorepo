import type { parse } from "svelte/compiler"
import type { BaseDirective } from "svelte/types/compiler/interfaces"

export type Ast = ReturnType<typeof parse>
export type TemplateNode = Ast["html"]

export type ElementNode<Name extends stirng> = {
	start: number
	end: number
	type: "Element"
	attributes: (Attribute<any> | SpreadAttribute | BaseDirective)[]
} & (Name extends "svelte:element"
	? {
			name: "svelte:element"
			tag: string | Expression
		}
	: { name: Name })

type Expression = {
	start: number
	end: number
}

type SpreadAttribute = Extract<TemplateNode, { type: "Spread" }>
type Attribute<Name extends string> = Extract<TemplateNode, { type: "Attribute"; name: Name }> & {
	value: AttributeValue[] | boolean
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
	| {
			start: number
			end: number
			type: "AttributeShorthand"
			expression: {
				start: number
				end: number
			}
	  }
