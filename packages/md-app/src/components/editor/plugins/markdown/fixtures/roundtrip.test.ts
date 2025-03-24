import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { ExtendedMarkdownPlugin } from "../markdown-plugin.js";

import {
	SanitizedBlockHtmlPlugin,
	SanitizedBlockPlugin,
	SanitizedElementLeaf,
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
 * with a more nuanced comparison system:
 * - 🟢 Green: Input equals output (perfect roundtrip)
 * - 🟡 Yellow: Output doesn't match input but matches expected (acceptable transformation)
 * - 🔴 Red: Output doesn't match input and doesn't match expected (failing test)
 *
 * Known issues in the markdown parser:
 * 1. Line breaks in code blocks are not preserved
 * 2. Nested backticks in code blocks (like ``` inside ````) are not properly handled
 * 3. Line breaks in paragraphs (trailing spaces or backslash) are not preserved
 * 4. Some link formats are modified (e.g., automatic links)
 * 5. Indentation in lists may change
 * 6. Empty lines between list items are removed
 */
function createDiffFile(
	fileName: string,
	original: string,
	expected: string,
	actual: string
) {
	// Split content by test case headings (## tc - ...)
	const originalSections = splitByTestCases(original);
	const expectedSections = splitByTestCases(expected);
	const actualSections = splitByTestCases(actual);

	let diffContent = `# Diff Results for ${fileName}\n\n`;

	// Add summary counts for different test statuses
	const totalTests = Object.keys(expectedSections).length;

	// Count tests by status
	let perfectTests = 0;
	let acceptableTests = 0;
	let failingTests = 0;

	for (const [title, expectedContent] of Object.entries(expectedSections)) {
		const originalContent = originalSections[title] || "";
		const actualContent = actualSections[title] || "";

		if (originalContent.trim() === actualContent.trim()) {
			// Perfect roundtrip
			perfectTests++;
		} else if (expectedContent.trim() === actualContent.trim()) {
			// Acceptable transformation
			acceptableTests++;
		} else {
			// Failing test
			failingTests++;
		}
	}

	diffContent += `## Test Summary\n\n`;
	diffContent += `- 🟢 Perfect roundtrip (input = output): ${perfectTests}/${totalTests} (${Math.round((perfectTests / totalTests) * 100)}%)\n`;
	diffContent += `- 🟡 Acceptable transformation (output ≠ input, output = expected): ${acceptableTests}/${totalTests} (${Math.round((acceptableTests / totalTests) * 100)}%)\n`;
	diffContent += `- 🔴 Failing test (output ≠ input, output ≠ expected): ${failingTests}/${totalTests} (${Math.round((failingTests / totalTests) * 100)}%)\n\n`;

	// Add overall status indicator
	if (failingTests === 0) {
		diffContent += `**Overall Status**: ✅ All tests passing (${perfectTests} perfect, ${acceptableTests} acceptable)\n\n`;
	} else {
		diffContent += `**Overall Status**: ❌ ${failingTests} failing tests\n\n`;
	}

	diffContent += `---\n\n`;

	// Process each test case
	for (const [title, expectedContent] of Object.entries(expectedSections)) {
		const originalContent = originalSections[title] || "";
		const actualContent = actualSections[title] || "";

		// Determine test status
		const isPerfect = originalContent.trim() === actualContent.trim();
		const isAcceptable =
			!isPerfect && expectedContent.trim() === actualContent.trim();
		const isFailing = !isPerfect && !isAcceptable;

		// Set display styles based on status
		let statusEmoji, inOutStatus, visualStatus, detailsOpen, titleStyle;

		if (isPerfect) {
			statusEmoji = "🟢";
			inOutStatus = "✅";
			visualStatus = "✅";
			detailsOpen = "";
			titleStyle = 'style="color:green; font-weight:bold;"';
		} else if (isAcceptable) {
			statusEmoji = "🟡";
			inOutStatus = "⚠️";
			visualStatus = "✅";
			detailsOpen = "";
			titleStyle = 'style="color:#cc7700; font-weight:bold;"';
		} else {
			// failing
			statusEmoji = "🔴";
			inOutStatus = "❌";
			visualStatus = "❌";
			detailsOpen = "open";
			titleStyle = 'style="color:red; font-weight:bold;"';
		}

		diffContent += `<details ${detailsOpen}>\n`;
		diffContent += `<summary><span ${titleStyle}>${title}</span> ${statusEmoji} <span title="Input = Output?">${inOutStatus}</span> <span title="Visual match?">${visualStatus}</span></summary>\n\n`;

		// Always show comparison table with appropriate columns
		if (isPerfect) {
			// Perfect match - just show original/actual (they're the same)
			diffContent += `<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

${originalContent}

</td>
</tr>
<tr>
<td>

<pre><code>${escapeHtml(originalContent)}</code></pre>

</td>
</tr>
</table>\n\n`;
		} else if (isAcceptable) {
			// Acceptable transformation - show input and actual
			// Also show expected only if it differs from input
			const showExpected = originalContent.trim() !== expectedContent.trim();

			if (showExpected) {
				// Three-column table when expected differs from input
				diffContent += `<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

${originalContent}

</td>
<td>

${expectedContent}

</td>
<td>

${actualContent}

</td>
</tr>
<tr>
<td>

<pre><code>${escapeHtml(originalContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(expectedContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(actualContent)}</code></pre>

</td>
</tr>
</table>\n\n`;
			} else {
				// Two-column table when expected = input
				diffContent += `<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

${originalContent}

</td>
<td>

${actualContent}

</td>
</tr>
<tr>
<td>

<pre><code>${escapeHtml(originalContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(actualContent)}</code></pre>

</td>
</tr>
</table>\n\n`;
			}
		} else {
			// Failing test - show input and actual
			// Also show expected only if it differs from input
			const showExpected = originalContent.trim() !== expectedContent.trim();

			if (showExpected) {
				// Three-column table when expected differs from input
				diffContent += `<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

${originalContent}

</td>
<td>

${expectedContent}

</td>
<td>

${actualContent}

</td>
</tr>
<tr>
<td>

<pre><code>${escapeHtml(originalContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(expectedContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(actualContent)}</code></pre>

</td>
</tr>
</table>\n\n`;
			} else {
				// Two-column table when expected = input
				diffContent += `<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

${originalContent}

</td>
<td>

${actualContent}

</td>
</tr>
<tr>
<td>

<pre><code>${escapeHtml(originalContent)}</code></pre>

</td>
<td>

<pre><code>${escapeHtml(actualContent)}</code></pre>

</td>
</tr>
</table>\n\n`;
			}
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
	if (!content.includes("## tc -")) {
		sections["Document"] = content;
		return sections;
	}

	const lines = content.split("\n");
	let currentTitle = "";
	let currentContent = "";

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.startsWith("## tc -")) {
			// If we've been collecting content, save it
			if (currentTitle) {
				sections[currentTitle] = currentContent.trim();
			}

			// Start new section
			currentTitle = line.substring(3).trim();
			currentContent = "";
		} else if (currentTitle) {
			// Add to current section
			currentContent += line + "\n";
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
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Concatenate all diff files into a single result.md file
 */
function concatDiffFiles() {
	// Check if any diff files exist
	const diffFiles = fs
		.readdirSync(fixturesDir)
		.filter((file) => file.endsWith(".diff.md"))
		.sort();

	if (diffFiles.length === 0) {
		console.log("No diff files found to concatenate.");
		return;
	}

	let resultContent = "# Markdown Roundtrip Test Results\n\n";

	// Collect statistics across all test files
	let totalPerfectTests = 0;
	let totalAcceptableTests = 0;
	let totalFailingTests = 0;
	let totalTests = 0;

	// Extract test summary from each diff file
	for (const diffFile of diffFiles) {
		const diffContent = fs.readFileSync(
			path.join(fixturesDir, diffFile),
			"utf-8"
		);

		// Extract test counts using regex
		const perfectMatch = diffContent.match(
			/🟢 Perfect roundtrip.*?(\d+)\/(\d+)/
		);
		const acceptableMatch = diffContent.match(
			/🟡 Acceptable transformation.*?(\d+)\/(\d+)/
		);
		const failingMatch = diffContent.match(/🔴 Failing test.*?(\d+)\/(\d+)/);

		if (perfectMatch && acceptableMatch && failingMatch) {
			totalPerfectTests += parseInt(perfectMatch[1], 10);
			totalAcceptableTests += parseInt(acceptableMatch[1], 10);
			totalFailingTests += parseInt(failingMatch[1], 10);
			totalTests += parseInt(perfectMatch[2], 10);
		}
	}

	// Add overall summary
	resultContent += `## Summary\n\n`;
	resultContent += `- Total test files: ${diffFiles.length}\n`;
	resultContent += `- Total test cases: ${totalTests}\n`;
	resultContent += `- Generated on: ${new Date().toISOString()}\n\n`;

	// Add overall status
	if (totalFailingTests === 0) {
		resultContent += `### Overall Status: ✅ All Tests Passing\n\n`;
	} else {
		resultContent += `### Overall Status: ❌ ${totalFailingTests} Failing Tests\n\n`;
	}

	// Add detailed statistics
	resultContent += `### Test Results Breakdown\n\n`;
	resultContent += `- 🟢 Perfect roundtrip: ${totalPerfectTests}/${totalTests} (${Math.round((totalPerfectTests / totalTests) * 100)}%)\n`;
	resultContent += `- 🟡 Acceptable transformation: ${totalAcceptableTests}/${totalTests} (${Math.round((totalAcceptableTests / totalTests) * 100)}%)\n`;
	resultContent += `- 🔴 Failing tests: ${totalFailingTests}/${totalTests} (${Math.round((totalFailingTests / totalTests) * 100)}%)\n\n`;

	// Add known issues section
	resultContent += `### Known Issues in the Markdown Parser\n\n`;
	resultContent += `1. Line breaks in code blocks are not preserved\n`;
	resultContent += `2. Nested backticks in code blocks (like \`\`\` inside \`\`\`\`) are not properly handled\n`;
	resultContent += `3. Line breaks in paragraphs (trailing spaces or backslash) are not preserved\n`;
	resultContent += `4. Some link formats are modified (e.g., automatic links)\n`;
	resultContent += `5. Indentation in lists may change\n`;
	resultContent += `6. Empty lines between list items are removed\n\n`;

	resultContent += `---\n\n`;

	// Concatenate each diff file with a section header
	for (const diffFile of diffFiles) {
		const testName = diffFile.replace(".diff.md", "");
		const diffContent = fs.readFileSync(
			path.join(fixturesDir, diffFile),
			"utf-8"
		);

		// Replace the first heading with our section heading
		const contentWithoutFirstHeading = diffContent
			.replace(/^# .*$/m, "")
			.trim();

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
	// Store test results to generate combined report
	const testResults = [];

	for (const file of fixturesFiles) {
		if (
			file.endsWith("expected.md") ||
			file.endsWith("diff.md") ||
			file === "result.md"
		) {
			continue;
		}

		test("in and out for " + file + " should match", async () => {
			// Read the original file
			const originalMarkdown = fs.readFileSync(
				`${fixturesDir}/${file}`,
				"utf-8"
			);

			const fileName = file.split(".")[0];

			// Get expected output (from .expected.md file if it exists, otherwise original is expected)
			let expectedMarkdown = originalMarkdown;
			if (fixturesFiles.includes(fileName + ".expected.md")) {
				expectedMarkdown = fs.readFileSync(
					`${fixturesDir}/${fileName}.expected.md`,
					"utf-8"
				);
			}

			expect(originalMarkdown).toBeDefined();

			// Process the Markdown through the editor
			const editor = createPlateEditor({
				override: {
					components: {
						[SanitizedBlockHtmlPlugin.key]: SanitizedElementLeaf,
						[SanitizedInlineHtmlPlugin.key]: SanitizedElementLeaf,
						[SanitizedBlockPlugin.key]: SanitizedElementLeaf,
					},
				},
				plugins: [
					ExtendedMarkdownPlugin,
					FrontMatterPlugin,
					SanitizedInlineHtmlPlugin,
					SanitizedBlockHtmlPlugin,
					SanitizedBlockPlugin,
				],
			});

			const deserializedNodes = editor
				.getApi(ExtendedMarkdownPlugin)
				.markdown.deserialize(originalMarkdown);

			const serializedMarkdown = editor
				.getApi(ExtendedMarkdownPlugin)
				.markdown.serialize(deserializedNodes);

			// Always create a diff file regardless of pass/fail status
			createDiffFile(
				fileName,
				originalMarkdown,
				expectedMarkdown,
				serializedMarkdown
			);
			testResults.push(fileName);

			try {
				// The test should still fail if actual doesn't match expected
				expect(serializedMarkdown).toBe(expectedMarkdown);
			} catch (error) {
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