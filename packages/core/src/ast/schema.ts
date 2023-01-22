/**
 * A single node of the AST.
 *
 * Every other defintions are based on Node.
 */
export type Node<Name> = {
	type: Name;
	/**
	 * Metadata is ignored by inlang.
	 *
	 * Use the metadata property to store additional
	 * information for a particular node like parsing
	 * and serialization information.
	 */
	metadata?: unknown;
};

/**
 * An identifier.
 *
 * Some Nodes have Identifiers such as a Resource or Message.
 */
export type Identifier = Node<"Identifier"> & {
	name: string;
};

/**
 * A resource is a collection of messages.
 */
export type Resource = Node<"Resource"> & {
	languageTag: LanguageTag;
	body: Array<Message>;
};

/**
 * A message is what's rendered to a user.
 */
export type Message = Node<"Message"> & {
	id: Identifier;
	// comment?: MessageComment;
	pattern: Pattern;
};

/**
 * A pattern denotes how a Message is composed.
 */
export type Pattern = Node<"Pattern"> & {
	elements: Array<Text>;
};

/**
 * Text can be translated.
 */
export type Text = Node<"Text"> & {
	value: string;
};

/**
 * A language tag that identifies a human language.
 *
 * The node is planned to obey to [IETF BCP 47 language tags](https://en.wikipedia.org/wiki/IETF_language_tag).
 * For now, only a name that acts as an ID can be set. See
 * https://github.com/inlang/inlang/issues/296
 */
export type LanguageTag = Node<"LanguageTag"> & {
	/**
	 * The ID of the language.
	 */
	name: string;

	/**
	 * Language must be an ISO-639-1 string.
	 *
	 * See https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes.
	 */
	// language: string;
};

// export type MessageComment = Node<"MessageComment"> & {
// 	value: string;
// };

// export type Placeholder = Node<"Placeholder"> & {
// 	expression: Expression;
// };

// /**
//  * A subset of expressions which can be used as outside of Placeholders.
//  */
// export type InlineExpression = Literal | Function | Variable | Placeholder;
// export declare type Expression = InlineExpression | SelectExpression;

// export type Literal = Node<"Literal"> & {
// 	value: string;
// };

// export type Variable = Node<"Variable"> & {
// 	id: Identifier;
// };

// export type Function = Node<"Function"> & {
// 	id: Identifier;
// };

// export type SelectExpression = Node<"SelectExpression"> & {
// 	selector: InlineExpression;
// 	variants: Array<Variant>;
// };

// export type Variant = Node<"Variant"> & {
// 	id: Identifier;
// 	pattern: Pattern;
// 	default: boolean;
// };
