import { ZettelDocNode } from "./nodes/doc.js";
import { TextNode } from "./nodes/text.js";
import { ZettelParagraphNode } from "./nodes/paragraph.js";
import { BoldMark } from "./marks/bold.js";
import { ItalicMark } from "./marks/italic.js";

export const ZettelExtensions = [
	ZettelDocNode,
	TextNode,
	ZettelParagraphNode,
	BoldMark,
	ItalicMark,
];
