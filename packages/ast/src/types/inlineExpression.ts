import type {
	FunctionReference,
	MessageReference,
	NumberLiteral,
	Placeable,
	StringLiteral,
	TermReference,
	VariableReference,
} from "../classes/index.js";

export type InlineExpression =
	| StringLiteral
	| NumberLiteral
	| FunctionReference
	| MessageReference
	| TermReference
	| VariableReference
	| Placeable;
