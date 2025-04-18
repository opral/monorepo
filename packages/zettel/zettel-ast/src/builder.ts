import type { Block, Span, MarkDef, AccountMentionMarkDef, LinkMarkDef } from "./schema.js";
import { nanoid } from "./utils/nano-id.js";

export function span(args: { text: string; marks?: string[] }): Span {
	return {
		_type: "span",
		_key: nanoid(),
		text: args.text,
		marks: args.marks ?? [],
	};
}

export function accountMention(args: { id: string }): AccountMentionMarkDef {
	return {
		_type: "accountMention",
		_key: nanoid(),
		id: args.id,
	};
}

export function link(args: { href: string }): LinkMarkDef {
	return {
		_type: "link",
		_key: nanoid(),
		href: args.href,
	};
}

export function block(args: {
	children: Span[];
	markDefs?: MarkDef[];
	/**
	 * The style of the block e.g. "normal", "h1", "h2", etc.
	 *
	 * @default "normal"
	 */
	style?: string;
}): Block {
	return {
		_type: "block",
		_key: nanoid(),
		style: args.style ?? "normal",
		markDefs: args.markDefs ?? [],
		children: args.children,
	};
}
