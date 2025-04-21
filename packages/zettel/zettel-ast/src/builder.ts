import type {
	ZettelTextBlock,
	ZettelSpan,
	MarkDef,
	ZettelAccountMentionMarkDef,
	ZettelLinkMarkDef,
} from "./schema.js";
import { nanoid } from "./utils/nano-id.js";

export function createZettelSpan(args: {
	text: string;
	marks?: ZettelSpan["marks"];
	_key?: string;
}): ZettelSpan {
	return {
		_type: "zettel.span",
		_key: args._key ?? nanoid(),
		text: args.text,
		marks: args.marks ?? [],
	};
}

export function createZettelAcountMentionMarkDef(args: {
	id: string;
	_key?: string;
}): ZettelAccountMentionMarkDef {
	return {
		_type: "zettel.accountMention",
		_key: args._key ?? nanoid(),
		id: args.id,
	};
}

export function createZettelLinkMarkDef(args: { href: string; _key?: string }): ZettelLinkMarkDef {
	return {
		_type: "zettel.link",
		_key: args._key ?? nanoid(),
		href: args.href,
	};
}

export function createZettelTextBlock(args: {
	children: ZettelSpan[];
	markDefs?: MarkDef[];
	_key?: string;
	/**
	 * The style of the block e.g. "normal", "h1", "h2", etc.
	 *
	 * @default "normal"
	 */
	style?: ZettelTextBlock["style"];
}): ZettelTextBlock {
	return {
		_type: "zettel.textBlock",
		_key: args._key ?? nanoid(),
		style: args.style ?? "normal",
		markDefs: args.markDefs ?? [],
		children: args.children,
	};
}
