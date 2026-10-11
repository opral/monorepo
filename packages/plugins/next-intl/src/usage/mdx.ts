import { parse, postprocess, preprocess } from "micromark";
import { mdxjs } from "micromark-extension-mdxjs";

/** A run of generated code copied unchanged from the MDX source. */
export type Segment = { generated: number; original: number; length: number };

/** Constructs whose code is collected, with the token types that hold the code. */
const EXPRESSIONS: Record<
	string,
	{ data: string; open: string; close: string }
> = {
	mdxFlowExpression: { data: "mdxFlowExpressionChunk", open: "[", close: "]" },
	mdxTextExpression: { data: "mdxTextExpressionChunk", open: "[", close: "]" },
	mdxJsxFlowTagAttributeValueExpression: {
		data: "mdxJsxFlowTagAttributeValueExpressionValue",
		open: "[",
		close: "]",
	},
	mdxJsxTextTagAttributeValueExpression: {
		data: "mdxJsxTextTagAttributeValueExpressionValue",
		open: "[",
		close: "]",
	},
	// `{...props}`: a spread into an array element, so a spread translator or catalog escapes
	mdxJsxFlowTagExpressionAttribute: {
		data: "mdxJsxFlowTagExpressionAttributeValue",
		open: "[{",
		close: "}]",
	},
	mdxJsxTextTagExpressionAttribute: {
		data: "mdxJsxTextTagExpressionAttributeValue",
		open: "[{",
		close: "}]",
	},
};

/**
 * The JavaScript of an MDX file as one module: its import/export blocks
 * verbatim, then each `{expression}` and JSX attribute expression as an array
 * element statement (`;[expression];`), so that it parses on its own and a
 * translator or message catalog in it is never mistaken for a call.
 * `segments` map generated offsets back to the MDX source.
 *
 * JSX element names and markdown are left out: they can't access messages.
 *
 * @throws on invalid MDX
 */
export function extractMdx(source: string): {
	code: string;
	segments: Segment[];
} {
	const events = postprocess(
		parse({ extensions: [mdxjs()] })
			.document()
			.write(preprocess()(source, undefined, true))
	);
	let code = "";
	const segments: Segment[] = [];
	const copy = (start: number, end: number) => {
		segments.push({
			generated: code.length,
			original: start,
			length: end - start,
		});
		code += source.slice(start, end);
	};
	let open: { type: string; chunks: [number, number][] } | undefined;
	for (const [kind, { type, start: from, end: to }] of events) {
		const token = { type: type as string, start: from, end: to };
		const start = token.start.offset;
		const end = token.end.offset;
		if (open) {
			if (kind === "enter" && token.type === EXPRESSIONS[open.type]!.data)
				open.chunks.push([start, end]);
			if (kind === "exit" && token.type === open.type) {
				const { open: before, close: after } = EXPRESSIONS[open.type]!;
				code += `\n;${before}`;
				open.chunks.forEach(([from, to], index) => {
					if (index > 0) code += "\n";
					copy(from, to);
				});
				code += `\n${after};`;
				open = undefined;
			}
			continue;
		}
		if (kind !== "enter") continue;
		if (token.type === "mdxjsEsm") {
			code += "\n";
			copy(start, end);
			code += "\n";
		} else if (EXPRESSIONS[token.type]) open = { type: token.type, chunks: [] };
	}
	return { code, segments };
}
