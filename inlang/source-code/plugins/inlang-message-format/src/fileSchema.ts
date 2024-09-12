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
	Type.String(),
	{ additionalProperties: false }
)

/**
 * 1. The storage schema is defined as object to enable the $schema
 *    property. The $schema property enables typesafety in most IDEs.
 *
 *
 * 2. For simplicity, the storage schema `data` property is
 *    identical to the I/O of the plugin functions.
 *
 *    Pros:
 *      - No need to transform the data (time complexity).
 *      - No need to maintain a separate data structure (space complexity).
 *      - No need for plugin authors to deal with optimizations (ecosystem complexity).
 *
 *    Cons:
 *      - No optimizations but they can be introduced in a non-breaking change manner
 *        in the future, IF REQUIRED.
 */
export type FileSchema = Static<typeof FileSchema>
export const FileSchema = Type.Union([InternalProperties, Messages])
