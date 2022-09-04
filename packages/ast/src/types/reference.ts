import type {
	FunctionReference,
	MessageReference,
	TermReference,
	VariableReference,
} from "../classes/index.js";

export type Reference =
	| VariableReference
	| TermReference
	| MessageReference
	| FunctionReference;
