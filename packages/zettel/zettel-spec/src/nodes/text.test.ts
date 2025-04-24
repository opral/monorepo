import { test, expect } from "vitest";
import type { ZettelDoc } from "./doc.js";
import { validateDoc } from "../validate-doc.js";

test("passes json schema validation", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: {
					zettel_key: "123456",
				},
				content: [
					{
						type: "text",
						text: "Hello World",
					},
				],
			},
		],
	};
	const result = validateDoc(doc);
	expect(result.errors).toBeUndefined();
});
