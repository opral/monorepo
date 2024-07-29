import { Type, type Static } from "@sinclair/typebox"
import type { Insertable, Selectable, Updateable } from "kysely"
import type { LintReport } from "./lint.js"

export const VariableReference = Type.Object({
	type: Type.Literal("variable"),
	name: Type.String(),
})

export const Literal = Type.Object({
	type: Type.Literal("literal"),
	name: Type.String(),
})

export const Option = Type.Object({
	name: Type.String(),
	value: Type.Union([Literal, VariableReference]),
})

const FunctionAnnotation = Type.Object({
	type: Type.Literal("function"),
	name: Type.String(),
	options: Type.Array(Option),
})

export const Expression = Type.Object({
	type: Type.Literal("expression"),
	arg: Type.Union([VariableReference, Literal]),
	annotation: Type.Optional(FunctionAnnotation),
})

export const Text = Type.Object({
	type: Type.Literal("text"),
	value: Type.String(),
})

export const Declaration = Type.Object({
	type: Type.Literal("input"),
	name: Type.String(),
	value: Expression,
})

export const Pattern = Type.Array(Type.Union([Text, Expression]))

export const Settings = Type.Object({
	baseLocale: Type.String(),
	locales: Type.String(),
	modules: Type.String(),
})

export const BundleTable = Type.Object({
	id: Type.String(),
	alias: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<AliasMap>
})

export const MessageTable = Type.Object({
	id: Type.String(),
	bundleId: Type.String(),
	locale: Type.String(),
	declarations: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<Declaration[]>
	selectors: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<Expression[]>
})

export const VariantTable = Type.Object({
	id: Type.String(),
	messageId: Type.String(),
	match: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<Record<Expression["arg"]["name"], string>>
	pattern: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<Pattern>
})

export const NestedMessage = Type.Object({
	id: Type.String(),
	locale: Type.String(),
	declarations: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<Declaration[]>
	selectors: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<Expression[]>
	variants: Type.Array(VariantTable),
})

export const NestedBundle = Type.Object({
	id: Type.String(),
	alias: Type.Any(), // TODO: Use appropriate Typebox type for JSONColumnType<AliasMap>
	messages: Type.Array(NestedMessage),
})

// Export types
export type BundleTable = Static<typeof BundleTable>
export type MessageTable = Static<typeof MessageTable>
export type VariantTable = Static<typeof VariantTable>

export type Bundle = Selectable<BundleTable>

export type NestedMessage = Selectable<MessageTable> & {
	variants: Selectable<VariantTable>[]
}

export type NestedBundle = Selectable<BundleTable> & {
	messages: NestedMessage[]
}

export type NewBundle = Insertable<BundleTable>
export type UpdatedBundle = Updateable<BundleTable>

export type Message = Selectable<MessageTable>
export type NewMessage = Insertable<MessageTable>
export type UpdatedMessage = Updateable<MessageTable>

export type Variant = Selectable<VariantTable>
export type NewVariant = Insertable<VariantTable>
export type UpdatedVariant = Updateable<VariantTable>

export type Pattern = Static<typeof Pattern>
export type Text = Static<typeof Text>
export type VariableReference = Static<typeof VariableReference>
export type Literal = Static<typeof Literal>
export type Declaration = Static<typeof Declaration>
export type Expression = Static<typeof Expression>
export type FunctionAnnotation = Static<typeof FunctionAnnotation>
export type Option = Static<typeof Option>
export type Settings = Static<typeof Settings>

export type Database = {
	bundle: Static<typeof BundleTable>
	message: Static<typeof MessageTable>
	variant: Static<typeof VariantTable>
	lintReport: LintReport
	settings: Static<typeof Settings>
}
