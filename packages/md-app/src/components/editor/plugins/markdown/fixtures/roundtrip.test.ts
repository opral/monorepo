import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { ExtendedMarkdownPlugin } from "../markdown-plugin.js";

import {
	SanitizedBlockHtmlPlugin,
	SanitizedHtmlElementLeaf,
	SanitizedInlineHtmlPlugin,
} from "../../sanitized-html.js";
import { FrontMatterPlugin } from "../../frontmatter-plugin.js";
import { createPlateEditor } from "@udecode/plate/react";

// Read all *.md files in the current folder
const fixturesDir = __dirname;
const fixturesFiles = fs
	.readdirSync(fixturesDir)
	.filter((file) => file.endsWith(".md"));

/**
 * Creates a diff.md file with an HTML table comparing expected and actual results
 */
function createDiffFile(fileName: string, expected: string, actual: string) {
	const diffContent = `<table>
<tr>
<td>expected</td>
<td>actual</td>
</tr>
<tr>
<td>

${expected}

</td>
<td>

${actual}

</td>
</tr>
</table>`;
	
	const diffPath = path.join(fixturesDir, `${fileName}.diff.md`);
	fs.writeFileSync(diffPath, diffContent);
	console.log(`Created diff file at: ${diffPath}`);
}

describe("roundtrip", () => {
	for (const file of fixturesFiles) {
		if (file.endsWith("expected.md") || file.endsWith("diff.md")) {
			continue;
		}
		test("in and out for " + file + " should match", async () => {
			const fixtureMarkdown = fs.readFileSync(
				`${fixturesDir}/${file}`,
				"utf-8"
			);

			const fileName = file.split(".")[0];

			let expectedMarkdown = fixtureMarkdown;

			if (fixturesFiles.includes(fileName + ".expected.md")) {
				expectedMarkdown = fs.readFileSync(
					`${fixturesDir}/${fileName}.expected.md`,
					"utf-8"
				);
			}
			expect(fixtureMarkdown).toBeDefined();

			// const editor = createPlateEditor()
			const editor = createPlateEditor({
				override: {
					components: {
						[SanitizedBlockHtmlPlugin.key]: SanitizedHtmlElementLeaf,
						[SanitizedInlineHtmlPlugin.key]: SanitizedHtmlElementLeaf,
					},
				},
				// override: {
				// 	components: withPlaceholders({
				// 		[SanitizedBlockHtmlPlugin.key]: SanitizedHtmlElementLeaf,
				// 		[SanitizedInlineHtmlPlugin.key]: SanitizedHtmlElementLeaf,
				// 	}),
				// },
				plugins: [
					ExtendedMarkdownPlugin,
					FrontMatterPlugin,
					SanitizedInlineHtmlPlugin,
					SanitizedBlockHtmlPlugin,
				],
			});

			const deserializedNodes = editor
				.getApi(ExtendedMarkdownPlugin)
				.markdown.deserialize(fixtureMarkdown);

			const serializedMarkdown = editor
				.getApi(ExtendedMarkdownPlugin)
				.markdown.serialize(deserializedNodes);

			try {
				expect(serializedMarkdown).toBe(expectedMarkdown);
			} catch (error) {
				// Create a diff file if the test fails
				createDiffFile(fileName, expectedMarkdown, serializedMarkdown);
				throw error; // Re-throw the error to fail the test
			}
		});
	}

	// 	test("in and out for " + file + " should match", async () => {
	// 		const editor = useCreateEditor();

	// 		const deserializedNodes = editor
	// 			.getApi(ExtendedMarkdownPlugin)
	// 			.markdown.deserialize(fixtureMarkdown);

	// 		const serializedMarkdown = editor
	// 			.getApi(ExtendedMarkdownPlugin)
	// 			.markdown.serialize(deserializedNodes);

	// 		expect(serializedMarkdown).toBe(fixtureMarkdown);
	// 		//
	// 	});
	// }
});
