import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { openLixInMemory } from "@lix-js/sdk";

test("it should not detect changes if the document did not update", async () => {
	const lix = await openLixInMemory({});

	const before = new TextEncoder().encode(
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
	// same file
	const after = before;

	const metadata = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		lix,
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});
	expect(detectedChanges).toEqual([]);
});
