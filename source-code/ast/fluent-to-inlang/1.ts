/**
 * A subset of Fluent in AST form.
 */

type Node<Name> = {
	type: Name;
};

type Resource = Node<"Resource"> & {
	body: Array<Message>;
};

type Message = Node<"Message"> & {
	id: Identifier;
	comment: Comment;
	value: Pattern;
};

type Pattern = Node<"Pattern"> & {
	elements: Array<PatternElement>;
};

type PatternElement = TextElement | Placeable;

type TextElement = Node<"TextElement"> & {
	value: string;
};

type Placeable = Node<"Placeable"> & {
	expression: Expression;
};

/**
 * A subset of expressions which can be used as outside of Placeables.
 */
export type InlineExpression =
	| Literal
	| FunctionReference
	| VariableReference
	| Placeable;
export declare type Expression = InlineExpression | SelectExpression;

type Literal = Node<"Literal"> & {
	value: string;
};

type VariableReference = Node<"VariableReference"> & {
	id: Identifier;
};

type FunctionReference = Node<"FunctionReference"> & {
	id: Identifier;
	arguments: CallArguments;
};

type SelectExpression = Node<"SelectExpression"> & {
	selector: InlineExpression;
	variants: Array<Variant>;
};

type CallArguments = Node<"CallArguments"> & {
	positional: Array<InlineExpression>;
	named: Array<NamedArgument>;
};

type Variant = Node<"Variant"> & {
	key: Identifier;
	value: Pattern;
	default: boolean;
};

type NamedArgument = Node<"NamedArgument"> & {
	name: Identifier;
	value: Literal;
};

type Identifier = Node<"Identifier"> & {
	name: string;
};
