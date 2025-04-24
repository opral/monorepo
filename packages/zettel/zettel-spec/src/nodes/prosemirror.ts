import { Schema, type NodeSpec, type MarkSpec } from "prosemirror-model";
import { ZettelParagraphSpec } from "./paragraph.js";
import type { ZettelNodeSpec } from "./zettel-node.js";
import { TextSpec } from "./text.js";
import { ZettelDocSpec } from "./doc.js";

const zettelNodes = {
	zettel_doc: ZettelDocSpec,
	text: TextSpec,
	zettel_paragraph: ZettelParagraphSpec,
} as const;

const zettelMarks: Record<string, MarkSpec> = {};

export class ZettelSchema<
	NodeNames extends string = keyof typeof zettelNodes,
	MarkNames extends string = keyof typeof zettelMarks,
> extends Schema<NodeNames, MarkNames> {
	constructor(options: {
		nodes?: Record<NodeNames, ZettelNodeSpec>;
		marks?: Record<MarkNames, MarkSpec>;
	}) {
		super({
			// @ts-expect-error - ts hacking
			nodes: { ...zettelNodes, ...(options.nodes || {}) },
			// @ts-expect-error - ts hacking
			marks: { ...zettelMarks, ...(options.marks || {}) },
			topNode: "zettel_doc",
		});
	}
}
