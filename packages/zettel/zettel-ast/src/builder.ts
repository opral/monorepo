import type { ZettelTextBlock, ZettelSpan, MarkDef, ZettelLink } from "./schema.js";
import { nanoid } from "./utils/nano-id.js";

export function createZettelSpan(args: {
	text: string;
	marks?: ZettelSpan["marks"];
	_key?: string;
	metadata?: ZettelSpan["metadata"];
}): ZettelSpan {
	const result: ZettelSpan = {
		_type: "zettel.span",
		_key: args._key ?? nanoid(),
		text: args.text,
		marks: args.marks ?? [],
	};
	if (args.metadata) {
		result.metadata = args.metadata;
	}
	return result;
}

export function createZettelLink(args: {
	href: string;
	_key?: string;
	metadata?: ZettelLink["metadata"];
}): ZettelLink {
	const result: ZettelLink = {
		_type: "zettel.link",
		_key: args._key ?? nanoid(),
		href: args.href,
	};
	if (args.metadata) {
		result.metadata = args.metadata;
	}
	return result;
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
	const result: ZettelTextBlock = {
		_type: "zettel.textBlock",
		_key: args._key ?? nanoid(),
		style: args.style ?? "normal",
		markDefs: args.markDefs ?? [],
		children: args.children,
	};
	if (args.metadata) {
		result.metadata = args.metadata;
	}
	return result;
}
