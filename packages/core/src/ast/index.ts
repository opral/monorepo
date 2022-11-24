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

export type Bundle = Node<"Bundle"> & {
	id: Identifier;
	resources: Resource[];
};

export type Resource = Node<"Resource"> & {
	id: Identifier;
	body: Array<Message>;
};

export type MessageComment = Node<"MessageComment"> & {
	value: string;
};

export type Message = Node<"Message"> & {
	id: Identifier;
	comment?: MessageComment;
	pattern: Pattern;
};

export type Pattern = Node<"Pattern"> & {
	elements: Array<Text | Placeholder>;
};

export type Text = Node<"Text"> & {
	value: string;
};

export type Placeholder = Node<"Placeholder"> & {
	expression: Expression;
};

/**
 * A subset of expressions which can be used as outside of Placeholders.
 */
export type InlineExpression = Literal | Function | Variable | Placeholder;
export declare type Expression = InlineExpression | SelectExpression;

export type Literal = Node<"Literal"> & {
	value: string;
};

export type Variable = Node<"Variable"> & {
	id: Identifier;
};

export type Function = Node<"Function"> & {
	id: Identifier;
};

export type SelectExpression = Node<"SelectExpression"> & {
	selector: InlineExpression;
	variants: Array<Variant>;
};

export type Variant = Node<"Variant"> & {
	id: Identifier;
	pattern: Pattern;
	default: boolean;
};

export type Identifier = Node<"Identifier"> & {
	name: string;
};
