import type { Insertable, JSONColumnType, Selectable, Updateable } from "kysely"

import type { LintReport } from "./lint.js"

export type Database = {
	bundle: BundleTable
	message: MessageTable
	variant: VariantTable

	lintReport: LintReport
	// todo - move out of database
	settings: Settings
}

type AliasMap = {
	[key: string]: string
}

// Bundles all languages of a message -
type BundleTable = {
	id: string
	// todo make alias relational
	alias: JSONColumnType<AliasMap> // alias usually have a property "default"  that represents the message name like "welcome_message" or "login_button"
	// messages[] @relation
	// messages: Message[]
}

type MessageTable = {
	id: string
	// @relation to Bundle
	bundleId: BundleTable["id"]
	locale: string
	declarations: JSONColumnType<Declaration[]> // JSON
	selectors: JSONColumnType<Expression[]> // JSON
	// variants: Variant[]
}

type VariantTable = {
	id: string
	// @relation to Message
	messageId: MessageTable["id"]
	match: JSONColumnType<Record<Expression["arg"]["name"], string>>
	pattern: JSONColumnType<Pattern> // JSON
}

export type Bundle = Selectable<BundleTable>

export type NestedMessage = Message & {
	variants: Variant[]
}

export type NestedBundle = Bundle & {
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

export type Pattern = Array<Text | Expression>

export type Text = {
	type: "text"
	value: string
}

export type VariableReference = {
	type: "variable"
	name: string
}

export type Literal = {
	type: "literal"
	name: string
}

export type Declaration = InputDeclaration

export type InputDeclaration = {
	type: "input"
	name: string
	value: Expression
}

export type Expression = {
	type: "expression"
	arg: VariableReference | Literal
	annotation?: FunctionAnnotation
}

export type FunctionAnnotation = {
	type: "function"
	name: string
	options: Option[]
}

export type Option = {
	name: string
	value: Literal | VariableReference
}

export type Settings = {
	baseLocale: string
	locales: string
	modules: string
}
