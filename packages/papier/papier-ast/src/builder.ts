// Papier AST builder utilities (object pattern for all)
import type { PapierAst, Block, Span, MarkDef } from "./schema.js";

import { nanoid } from "./utils/nano-id.js";

export function span(args: { text: string; marks?: string[] }): Span {
	return {
		_type: "span",
		_key: nanoid(),
		text: args.text,
		marks: args.marks ?? [],
	};
}

export function accountMention(args: { id: string; name: string }): Span & { __markDef: MarkDef } {
	const key = nanoid();
	return {
		_type: "span",
		_key: key,
		text: args.name,
		marks: [key],
		__markDef: {
			_type: "accountMention",
			_key: key,
			id: args.id,
			name: args.name,
		},
	};
}

export function link(args: {
	label: string;
	href: string;
	marks?: string[];
}): Span & { __markDef: MarkDef } {
	const key = nanoid();
	return {
		_type: "span",
		_key: key,
		text: args.label,
		marks: args.marks ?? [key],
		__markDef: {
			_type: "link",
			_key: key,
			href: args.href,
		},
	};
}

export function block(args: {
	children: (Span | (Span & { __markDef?: MarkDef }))[];
	/**
	 * The style of the block e.g. "normal", "h1", "h2", etc.
	 *
	 * @default "normal"
	 */
	style?: string;
}): Block {
	const markDefs: MarkDef[] = [];
	const normalizedChildren = args.children.map((child) => {
		if ((child as any).__markDef) {
			markDefs.push((child as any).__markDef);
			const { __markDef, ...rest } = child as any;
			return rest;
		}
		return child;
	});
	return {
		_type: "block",
		_key: nanoid(),
		style: args.style ?? "normal",
		markDefs,
		children: normalizedChildren,
	};
}
