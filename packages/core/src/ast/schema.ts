// inspired by (https://github.com/unicode-org/message-format-wg/blob/main/spec/syntax.md)

/**
 * An identifier.
 *
 * Some Nodes have Identifiers such as a Message.
 */
export type Identifier = {
	type: "Identifier"
	name: string
}

/**
 * A resource is a collection of messages.
 */
export type Resource = {
	type: "Resource"
	languageTag: LanguageTag
	body: Array<Message>
}

/**
 * A message is what's rendered to a user.
 */
export type Message = {
	type: "Message"
	id: Identifier
	pattern: Pattern
}

/**
 * A pattern denotes how a Message is composed.
 */
export type Pattern = {
	type: "Pattern"
	elements: Array<Text | Placeholder>
}

/**
 * Text can be translated.
 */
export type Text = {
	type: "Text"
	value: string
}

export type Placeholder = {
	type: "Placeholder"
	// only variable reference for now, but will be extended in the future
	body: VariableReference
}

export type VariableReference = {
	type: "VariableReference"
	name: string
}

/**
 * A language tag that identifies a human language.
 *
 * The node is planned to obey to [IETF BCP 47 language tags](https://en.wikipedia.org/wiki/IETF_language_tag).
 * For now, only a name that acts as an ID can be set. See
 * https://github.com/inlang/inlang/issues/296
 */
export type LanguageTag = {
	type: "LanguageTag"
	/**
	 * The ID of the language.
	 */
	name: string
}
