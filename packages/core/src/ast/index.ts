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
 * Some Nodes have Identifiers such as a Bundle or Message.
 */
export type Identifier = Node<"Identifier"> & {
	name: string;
};

/**
 * A bundle holds a group of resources.
 */
export type Bundle = Node<"Bundle"> & {
	id: Identifier;
	resources: Resource[];
};

/**
 * A resource is a collection of messages.
 */
export type Resource = Node<"Resource"> & {
	id: Identifier;
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
