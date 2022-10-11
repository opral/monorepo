/*
 * Base class for all Fluent AST nodes.
 *
 * All productions described in the ASDL subclass BaseNode, including Span and
 * Annotation.
 *
 */
export abstract class BaseNode {
	abstract type: string;

	[name: string]: unknown;

	equals(other: BaseNode, ignoredFields: Array<string> = ["span"]): boolean {
		const thisKeys = new Set(Object.keys(this));
		const otherKeys = new Set(Object.keys(other));
		if (ignoredFields) {
			for (const fieldName of ignoredFields) {
				thisKeys.delete(fieldName);
				otherKeys.delete(fieldName);
			}
		}
		if (thisKeys.size !== otherKeys.size) {
			return false;
		}
		for (const fieldName of thisKeys) {
			if (!otherKeys.has(fieldName)) {
				return false;
			}
			const thisVal = this[fieldName];
			const otherVal = other[fieldName];
			if (typeof thisVal !== typeof otherVal) {
				return false;
			}
			if (thisVal instanceof Array && otherVal instanceof Array) {
				if (thisVal.length !== otherVal.length) {
					return false;
				}
				for (let i = 0; i < thisVal.length; ++i) {
					if (!scalarsEqual(thisVal[i], otherVal[i], ignoredFields)) {
						return false;
					}
				}
			} else if (!scalarsEqual(thisVal, otherVal, ignoredFields)) {
				return false;
			}
		}
		return true;
	}

	clone(): this {
		function visit(value: unknown): unknown {
			if (value instanceof BaseNode) {
				return value.clone();
			}
			if (Array.isArray(value)) {
				return value.map(visit);
			}
			return value;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const clone = Object.create(this.constructor.prototype) as this;
		for (const prop of Object.keys(this)) {
			clone[prop] = visit(this[prop]);
		}
		return clone;
	}
}

function scalarsEqual(
	thisVal: unknown,
	otherVal: unknown,
	ignoredFields: Array<string>
): boolean {
	if (thisVal instanceof BaseNode && otherVal instanceof BaseNode) {
		return thisVal.equals(otherVal, ignoredFields);
	}
	return thisVal === otherVal;
}

/*
 * Base class for AST nodes which can have Spans.
 */
export abstract class SyntaxNode extends BaseNode {
	public span?: Span;

	addSpan(start: number, end: number): void {
		this.span = new Span(start, end);
	}
}

export class Resource extends SyntaxNode {
	public type = "Resource" as const;
	public body: Array<Entry>;
	constructor(body: Array<Entry> = []) {
		super();
		this.body = body;
	}
}

export declare type Entry = Message | Term | Comments | Junk;

export class Message extends SyntaxNode {
	public type = "Message" as const;
	public id: Identifier;
	public value: Pattern | null;
	public attributes: Array<Attribute>;
	public comment: Comment | null;

	constructor(
		id: Identifier,
		value: Pattern | null = null,
		attributes: Array<Attribute> = [],
		comment: Comment | null = null
	) {
		super();
		this.id = id;
		this.value = value;
		this.attributes = attributes;
		this.comment = comment;
	}
}

export class Term extends SyntaxNode {
	public type = "Term" as const;
	public id: Identifier;
	public value: Pattern;
	public attributes: Array<Attribute>;
	public comment: Comment | null;

	constructor(
		id: Identifier,
		value: Pattern,
		attributes: Array<Attribute> = [],
		comment: Comment | null = null
	) {
		super();
		this.id = id;
		this.value = value;
		this.attributes = attributes;
		this.comment = comment;
	}
}

export class Pattern extends SyntaxNode {
	public type = "Pattern" as const;
	public elements: Array<PatternElement>;

	constructor(elements: Array<PatternElement>) {
		super();
		this.elements = elements;
	}
}

export declare type PatternElement = TextElement | Placeable;

export class TextElement extends SyntaxNode {
	public type = "TextElement" as const;
	public value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Placeable extends SyntaxNode {
	public type = "Placeable" as const;
	public expression: Expression;

	constructor(expression: Expression) {
		super();
		this.expression = expression;
	}
}

/**
 * A subset of expressions which can be used as outside of Placeables.
 */
export type InlineExpression =
	| StringLiteral
	| NumberLiteral
	| FunctionReference
	| MessageReference
	| TermReference
	| VariableReference
	| Placeable;
export declare type Expression = InlineExpression | SelectExpression;

// An abstract base class for Literals.
export abstract class BaseLiteral extends SyntaxNode {
	public value: string;

	constructor(value: string) {
		super();
		// The "value" field contains the exact contents of the literal,
		// character-for-character.
		this.value = value;
	}

	abstract parse(): { value: unknown };
}

export class StringLiteral extends BaseLiteral {
	public type = "StringLiteral" as const;

	parse(): { value: string } {
		// Backslash backslash, backslash double quote, uHHHH, UHHHHHH.
		const KNOWN_ESCAPES =
			/(?:\\\\|\\"|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;

		function fromEscapeSequence(
			match: string,
			codepoint4: string,
			codepoint6: string
		): string {
			switch (match) {
				case "\\\\":
					return "\\";
				case '\\"':
					return '"';
				default: {
					let codepoint = parseInt(codepoint4 || codepoint6, 16);
					if (codepoint <= 0xd7ff || 0xe000 <= codepoint) {
						// It's a Unicode scalar value.
						return String.fromCodePoint(codepoint);
					}
					// Escape sequences reresenting surrogate code points are
					// well-formed but invalid in Fluent. Replace them with U+FFFD
					// REPLACEMENT CHARACTER.
					return "�";
				}
			}
		}

		let value = this.value.replace(KNOWN_ESCAPES, fromEscapeSequence);
		return { value };
	}
}

export class NumberLiteral extends BaseLiteral {
	public type = "NumberLiteral" as const;

	parse(): { value: number; precision: number } {
		let value = parseFloat(this.value);
		let decimalPos = this.value.indexOf(".");
		let precision = decimalPos > 0 ? this.value.length - decimalPos - 1 : 0;
		return { value, precision };
	}
}

export declare type Literal = StringLiteral | NumberLiteral;

export class MessageReference extends SyntaxNode {
	public type = "MessageReference" as const;
	public id: Identifier;
	public attribute: Identifier | null;

	constructor(id: Identifier, attribute: Identifier | null = null) {
		super();
		this.id = id;
		this.attribute = attribute;
	}
}

export class TermReference extends SyntaxNode {
	public type = "TermReference" as const;
	public id: Identifier;
	public attribute: Identifier | null;
	public arguments: CallArguments | null;

	constructor(
		id: Identifier,
		attribute: Identifier | null = null,
		args: CallArguments | null = null
	) {
		super();
		this.id = id;
		this.attribute = attribute;
		this.arguments = args;
	}
}

export class VariableReference extends SyntaxNode {
	public type = "VariableReference" as const;
	public id: Identifier;

	constructor(id: Identifier) {
		super();
		this.id = id;
	}
}

export class FunctionReference extends SyntaxNode {
	public type = "FunctionReference" as const;
	public id: Identifier;
	public arguments: CallArguments;

	constructor(id: Identifier, args: CallArguments) {
		super();
		this.id = id;
		this.arguments = args;
	}
}

export class SelectExpression extends SyntaxNode {
	public type = "SelectExpression" as const;
	public selector: InlineExpression;
	public variants: Array<Variant>;

	constructor(selector: InlineExpression, variants: Array<Variant>) {
		super();
		this.selector = selector;
		this.variants = variants;
	}
}

export class CallArguments extends SyntaxNode {
	public type = "CallArguments" as const;
	public positional: Array<InlineExpression>;
	public named: Array<NamedArgument>;

	constructor(
		positional: Array<InlineExpression> = [],
		named: Array<NamedArgument> = []
	) {
		super();
		this.positional = positional;
		this.named = named;
	}
}

export class Attribute extends SyntaxNode {
	public type = "Attribute" as const;
	public id: Identifier;
	public value: Pattern;

	constructor(id: Identifier, value: Pattern) {
		super();
		this.id = id;
		this.value = value;
	}
}

export class Variant extends SyntaxNode {
	public type = "Variant" as const;
	public key: Identifier | NumberLiteral;
	public value: Pattern;
	public default: boolean;

	constructor(key: Identifier | NumberLiteral, value: Pattern, def: boolean) {
		super();
		this.key = key;
		this.value = value;
		this.default = def;
	}
}

export class NamedArgument extends SyntaxNode {
	public type = "NamedArgument" as const;
	public name: Identifier;
	public value: Literal;

	constructor(name: Identifier, value: Literal) {
		super();
		this.name = name;
		this.value = value;
	}
}

export class Identifier extends SyntaxNode {
	public type = "Identifier" as const;
	public name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export abstract class BaseComment extends SyntaxNode {
	public content: string;
	constructor(content: string) {
		super();
		this.content = content;
	}
}

export class Comment extends BaseComment {
	public type = "Comment" as const;
}

export class GroupComment extends BaseComment {
	public type = "GroupComment" as const;
}
export class ResourceComment extends BaseComment {
	public type = "ResourceComment" as const;
}

export declare type Comments = Comment | GroupComment | ResourceComment;

export class Junk extends SyntaxNode {
	public type = "Junk" as const;
	public annotations: Array<Annotation>;
	public content: string;

	constructor(content: string) {
		super();
		this.annotations = [];
		this.content = content;
	}

	addAnnotation(annotation: Annotation): void {
		this.annotations.push(annotation);
	}
}

export class Span extends BaseNode {
	public type = "Span" as const;
	public start: number;
	public end: number;

	constructor(start: number, end: number) {
		super();
		this.start = start;
		this.end = end;
	}
}

export class Annotation extends SyntaxNode {
	public type = "Annotation" as const;
	public code: string;
	public arguments: Array<unknown>;
	public message: string;

	constructor(code: string, args: Array<unknown> = [], message: string) {
		super();
		this.code = code;
		this.arguments = args;
		this.message = message;
	}
}
