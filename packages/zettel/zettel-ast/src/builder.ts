import type {
	ZettelTextBlock,
	ZettelSpan,
	MarkDef,
	ZettelAccountMentionAnnotation,
	ZettelLinkAnnotation,
} from "./schema.js";
import { nanoid } from "./utils/nano-id.js";

export function span(args: { text: string; marks?: ZettelSpan["marks"] }): ZettelSpan {
	return {
		_type: "zettel.span",
		_key: nanoid(),
		text: args.text,
		marks: args.marks ?? [],
	};
}

export function accountMention(args: { id: string }): ZettelAccountMentionAnnotation {
	return {
		_type: "zettel.accountMention",
		_key: nanoid(),
		id: args.id,
	};
}

export function link(args: { href: string }): ZettelLinkAnnotation {
	return {
		_type: "zettel.link",
		_key: nanoid(),
		href: args.href,
	};
}

export function textBlock(args: {
	children: ZettelSpan[];
	markDefs?: MarkDef[];
	/**
	 * The style of the block e.g. "normal", "h1", "h2", etc.
	 *
	 * @default "normal"
	 */
	style?: ZettelTextBlock["style"];
}): ZettelTextBlock {
	return {
		_type: "zettel.textBlock",
		_key: nanoid(),
		style: args.style ?? "normal",
		markDefs: args.markDefs ?? [],
		children: args.children,
	};
}
