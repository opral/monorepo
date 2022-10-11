/**
 * A subset of Fluent in AST form.
 */

type Node<Name> = {
	type: Name;
};

type Resource = Node<"Resource"> & {
	body: Array<Message>;
};

type MessageComment = Node<"MessageComment"> & {
	value: string;
};

type Message = Node<"Message"> & {
	id: Identifier;
	comment: MessageComment;
	pattern: Pattern;
};

type Pattern = Node<"Pattern"> & {
	elements: Array<Text | Placeholder>;
};

type Text = Node<"Text"> & {
	value: string;
};

type Placeholder = Node<"Placeholder"> & {
	expression: Expression;
};

/**
 * A subset of expressions which can be used as outside of Placeholders.
 */
export type InlineExpression = Literal | Function | Variable | Placeholder;
export declare type Expression = InlineExpression | SelectExpression;

type Literal = Node<"Literal"> & {
	value: string;
};

type Variable = Node<"Variable"> & {
	id: Identifier;
};

type Function = Node<"Function"> & {
	id: Identifier;
};

type SelectExpression = Node<"SelectExpression"> & {
	selector: InlineExpression;
	variants: Array<Variant>;
};

type Variant = Node<"Variant"> & {
	id: Identifier;
	pattern: Pattern;
	default: boolean;
};

type Identifier = Node<"Identifier"> & {
	name: string;
};
