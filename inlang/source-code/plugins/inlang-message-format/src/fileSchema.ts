import { Type, type Static } from "@sinclair/typebox"

const InternalProperties = Type.Object(
	{ $schema: Type.Optional(Type.Literal("https://inlang.com/schema/inlang-message-format")) },
	{ additionalProperties: false }
)

const Messages = Type.Record(
	Type.String({
		pattern: "^[^\\.-]+$",
		description:
			"The message key. Hypens (-) and dots (.) are not allowed to increase compatibility with libraries.",
		examples: ["helloWorld", "hello_world", "helloWorld123", "hello_world_123"],
	}),
	Type.Union([Type.String(), Type.Record(Type.String(), Type.String())]),

	{ additionalProperties: false }
)

/**
 * The storage schema is defined as object to enable the $schema
 * property. The $schema property enables typesafety in most IDEs.
 *
 * ! DO NOT USE THE SCHEMA TO PERFORM VALIDATION.
 * ! The schema disallows additional properties. If an old version
 * ! tries to parse a newer version that has new properties, the
 * ! validation will fail.
 */
export type FileSchema = Static<typeof FileSchema>
export const FileSchema = Type.Union([InternalProperties, Messages])
