import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDatabase,
	type RxJsonSchema,
} from "rxdb"

export const HeroSchemaLiteral = {
	title: "hero",
	description: "an individual hero",
	version: 0,
	type: "object",
	// indexes: ["createdAt", "updatedAt"],
	primaryKey: "id",
	properties: {
		id: {
			type: "string",
			maxLength: 100, // <- the primary key must have set maxLength
		},
		name: {
			type: "string",
		},
		age: {
			type: "number",
		},
		createdAt: {
			type: "number",
		},
		updatedAt: {
			type: "number",
		},
		mergeConflict: {
			type: "object",
			properties: {} as any,
		},
	},
	required: ["id", "name", "createdAt", "updatedAt"],
} as const

export const SchemaTyped = toTypedRxJsonSchema(HeroSchemaLiteral)

// aggregate the document type from the schema
export type HeroDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof SchemaTyped>

// create the typed RxJsonSchema from the literal typed object.
export const HeroSchema: RxJsonSchema<HeroDocType> = SchemaTyped

type HeroesCollection = RxCollection<HeroDocType>

export type MyDatabaseCollections = {
	heroes: HeroesCollection
}

export type MyDatabase = RxDatabase<MyDatabaseCollections>
