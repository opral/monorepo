import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";

test("it applies an insertion of a node", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [],
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "39u49u212",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "/mock" },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
		lix,
	});

	expect(applied).toEqual(after);
});
