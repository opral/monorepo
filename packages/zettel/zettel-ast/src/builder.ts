import type { ZettelTextBlock, ZettelSpan, MarkDef, ZettelLink } from "./schema.js";
import { nanoid } from "./utils/nano-id.js";

export function createZettelSpan(args: {
	text: string;
	marks?: ZettelSpan["marks"];
	_key?: string;
	metadata?: ZettelSpan["metadata"];
}): ZettelSpan {
	return {
		_type: "zettel.span",
		_key: args._key ?? nanoid(),
		text: args.text,
		marks: args.marks ?? [],
		metadata: args.metadata ?? {},
	};
}

export function createZettelLink(args: {
	href: string;
	_key?: string;
	metadata?: ZettelLink["metadata"];
}): ZettelLink {
	return {
		_type: "zettel.link",
		_key: args._key ?? nanoid(),
		href: args.href,
		metadata: args.metadata ?? {},
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
	metadata?: ZettelTextBlock["metadata"];
}): ZettelTextBlock {
	return {
		_type: "zettel.textBlock",
		_key: args._key ?? nanoid(),
		style: args.style ?? "normal",
		markDefs: args.markDefs ?? [],
		children: args.children,
		metadata: args.metadata ?? {},
	};
}
