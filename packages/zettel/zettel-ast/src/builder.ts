import type { ZettelTextBlock, ZettelSpan, ZettelLinkMark } from "./schema.js";
import { nanoid } from "./utils/nano-id.js";

export function createZettelSpan(args: {
	text: string;
	marks?: ZettelSpan["marks"];
	zettel_key?: string;
	metadata?: ZettelSpan["metadata"];
}): ZettelSpan {
	const result: ZettelSpan = {
		type: "zettel_span",
		zettel_key: args.zettel_key ?? nanoid(),
		text: args.text,
		marks: args.marks ?? [],
	};
	if (args.metadata) {
		result.metadata = args.metadata;
	}
	return result;
}

export function createZettelLinkMark(args: {
	href: string;
	zettel_key?: string;
	metadata?: ZettelLinkMark["metadata"];
}): ZettelLinkMark {
	const result: ZettelLinkMark = {
		type: "zettel_link",
		zettel_key: args.zettel_key ?? nanoid(),
		href: args.href,
	};
	if (args.metadata) {
		result.metadata = args.metadata;
	}
	return result;
}

export function createZettelTextBlock(args: {
	children: ZettelSpan[];
	zettel_key?: string;
	/**
	 * The style of the block e.g. "normal", "h1", "h2", etc.
	 *
	 * @default "normal"
	 */
	style?: ZettelTextBlock["style"];
	metadata?: ZettelTextBlock["metadata"];
}): ZettelTextBlock {
	const result: ZettelTextBlock = {
		type: "zettel_text_block",
		zettel_key: args.zettel_key ?? nanoid(),
		style: args.style ?? "normal",
		children: args.children,
	};
	if (args.metadata) {
		result.metadata = args.metadata;
	}
	return result;
}
