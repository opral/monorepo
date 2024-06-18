import { MessageBundle } from "../../../src/v2/types"
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDatabase,
	type RxJsonSchema,
} from "rxdb"

export const MessageBundleRx = {
	title: "messageBundle",
	description: "Bundle of localized messages",
	version: 0,
	type: "object",
	// indexes: ["createdAt", "updatedAt"],
	primaryKey: "id",
	properties: MessageBundle.properties,
	required: ["id", "alias", "messages"],
} as const

export const SchemaTyped = toTypedRxJsonSchema(MessageBundleRx)

// aggregate the document type from the schema
export type MessageBundleRxType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof SchemaTyped>

// create the typed RxJsonSchema from the literal typed object.
export const MessageBundleRxSchema: RxJsonSchema<MessageBundleRxType> = SchemaTyped

type MessageBundleCollection = RxCollection<MessageBundleRxType>

export type MyBundleCollections = {
	messageBundles: MessageBundleCollection
}

export type MyDatabase = RxDatabase<MyBundleCollections>
