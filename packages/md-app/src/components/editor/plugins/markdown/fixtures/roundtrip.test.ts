import fs from "fs";
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

describe("roundtrip", () => {
	for (const file of fixturesFiles) {
		if (file.endsWith("expected.md")) {
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

			expect(serializedMarkdown).toBe(expectedMarkdown);
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
