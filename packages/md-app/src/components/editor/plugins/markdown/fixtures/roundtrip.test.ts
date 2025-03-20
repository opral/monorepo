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
 * Creates a diff.md file with collapsible sections for each test case
 */
function createDiffFile(fileName: string, expected: string, actual: string) {
	// Split content by test case headings (## tc - ...)
	const expectedSections = splitByTestCases(expected);
	const actualSections = splitByTestCases(actual);
	
	let diffContent = `# Diff Results for ${fileName}\n\n`;
	
	// Add summary count
	const totalTests = Object.keys(expectedSections).length;
	const passedTests = Object.entries(expectedSections).filter(([title, expectedContent]) => {
		const actualContent = actualSections[title] || '';
		return expectedContent.trim() === actualContent.trim();
	}).length;
	
	diffContent += `**Test Summary:** ${passedTests}/${totalTests} tests passing ✅\n\n`;
	
	// Process each test case
	for (const [title, expectedContent] of Object.entries(expectedSections)) {
		const actualContent = actualSections[title] || ''; 
		const isEqual = expectedContent.trim() === actualContent.trim();
		const checkmark = isEqual ? '✅' : '❌';
		const detailsOpen = isEqual ? '' : 'open';
		const titleStyle = isEqual 
			? 'style="color:green; font-weight:bold;"' 
			: 'style="color:red; font-weight:bold;"';
		
		diffContent += `<details ${detailsOpen}>\n`;
		diffContent += `<summary><span ${titleStyle}>${title}</span> ${checkmark}</summary>\n\n`;
		
		if (!isEqual) {
			diffContent += `<table>
<tr>
<th style="width: 50%">Expected</th>
<th style="width: 50%">Actual</th>
</tr>
<tr>
<td>

${expectedContent}

</td>
<td>

${actualContent}

</td>
</tr>
<tr>
<td>

<pre><code>${escapeHtml(expectedContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(actualContent)}</code></pre>

</td>
</tr>
</table>\n\n`;
		} else {
			// If content is identical, show it anyway but without the raw code view
			diffContent += `<table>
<tr>
<th colspan="2">Content</th>
</tr>
<tr>
<td colspan="2">

${expectedContent}

</td>
</tr>
</table>\n\n`;
		}
		
		diffContent += `</details>\n\n`;
	}
	
	const diffPath = path.join(fixturesDir, `${fileName}.diff.md`);
	fs.writeFileSync(diffPath, diffContent);
	console.log(`Created diff file at: ${diffPath}`);
}

/**
 * Split markdown content by test case headings
 */
function splitByTestCases(content: string): Record<string, string> {
	const sections: Record<string, string> = {};
	
	// Handle case where no test cases are found
	if (!content.includes('## tc -')) {
		sections['Document'] = content;
		return sections;
	}
	
	const lines = content.split('\n');
	let currentTitle = '';
	let currentContent = '';
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		
		if (line.startsWith('## tc -')) {
			// If we've been collecting content, save it
			if (currentTitle) {
				sections[currentTitle] = currentContent.trim();
			}
			
			// Start new section
			currentTitle = line.substring(3).trim();
			currentContent = '';
		} else if (currentTitle) {
			// Add to current section
			currentContent += line + '\n';
		}
	}
	
	// Save the last section
	if (currentTitle) {
		sections[currentTitle] = currentContent.trim();
	}
	
	return sections;
}

/**
 * Escape HTML special characters for code display
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Concatenate all diff files into a single result.md file
 */
function concatDiffFiles() {
	// Check if any diff files exist
	const diffFiles = fs
		.readdirSync(fixturesDir)
		.filter(file => file.endsWith(".diff.md"))
		.sort();
	
	if (diffFiles.length === 0) {
		console.log("No diff files found to concatenate.");
		return;
	}
	
	let resultContent = "# Markdown Roundtrip Test Results\n\n";
	
	// Add overall summary
	resultContent += `## Summary\n\n`;
	resultContent += `- Total test files: ${diffFiles.length}\n`;
	resultContent += `- Generated on: ${new Date().toISOString()}\n\n`;
	resultContent += `---\n\n`;
	
	// Concatenate each diff file with a section header
	for (const diffFile of diffFiles) {
		const testName = diffFile.replace(".diff.md", "");
		const diffContent = fs.readFileSync(
			path.join(fixturesDir, diffFile),
			"utf-8"
		);
		
		// Replace the first heading with our section heading
		const contentWithoutFirstHeading = diffContent.replace(/^# .*$/m, "").trim();
		
		resultContent += `# Test File: ${testName}\n\n`;
		resultContent += contentWithoutFirstHeading;
		resultContent += "\n\n---\n\n";
	}
	
	// Write the concatenated content to result.md
	const resultPath = path.join(fixturesDir, "result.md");
	fs.writeFileSync(resultPath, resultContent);
	console.log(`Created combined result file at: ${resultPath}`);
}

describe("roundtrip", () => {
	// Store test failures to generate combined report at the end
	const testFailures = [];
	
	for (const file of fixturesFiles) {
		if (file.endsWith("expected.md") || file.endsWith("diff.md") || file === "result.md") {
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
				testFailures.push(fileName);
				throw error; // Re-throw the error to fail the test
			}
		});
	}
	
	// After all tests, create the concatenated result file
	afterAll(() => {
		concatDiffFiles();
	});

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
