import { test, expect } from "vitest";
import {
	createZettelAcountMentionMarkDef,
	createZettelLinkMarkDef,
	createZettelTextBlock,
	createZettelSpan,
} from "./builder.js";
import { serializeToText } from "./serialize-to-text.js";
import { ZettelDocJsonSchema } from "./schema.js";

test("serializes spans with no marks", () => {
	const ast = [
		createZettelTextBlock({
			style: "normal",
			children: [createZettelSpan({ text: "Hello world" })],
		}),
	];
	const serialized = serializeToText(ast);
	expect(serialized).toBe("Hello world");
});

test("serializes an account mention", () => {
	const accountMentionDef = createZettelAcountMentionMarkDef({ id: "47237hh8h4h75" });

	const ast = [
		createZettelTextBlock({
			style: "normal",
			markDefs: [accountMentionDef],
			children: [
				createZettelSpan({ text: "Hello " }),
				createZettelSpan({ text: "Developer", marks: [accountMentionDef._key] }),
			],
		}),
	];

	console.log(JSON.stringify(ZettelDocJsonSchema, null, 2));

	const serialized = serializeToText(ast);
	expect(serialized).toBe("Hello Developer");
});
