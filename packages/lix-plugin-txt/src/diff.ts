import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { diffLines, diffWords, diffChars } from "diff";
import type { Change } from "diff";

export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			--color-added-bg: rgba(46, 160, 67, 0.15);
			--color-added-text: #22863a;
			--color-deleted-bg: rgba(248, 81, 73, 0.15);
			--color-deleted-text: #b31d28;
			--color-border: #e1e4e8;
			--color-line-bg: #f6f8fa;
			--color-text: #24292e;
		}

		.diff-container {
			display: flex;
			flex-direction: column;
			border: 1px solid var(--color-border);
			border-radius: 6px;
			overflow: hidden;
			font-family: "Courier New", monospace;
		}

		.diff-section {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
			border-bottom: 1px solid var(--color-border);
		}

		.column {
			display: flex;
			flex-direction: column;
			border-right: 1px solid var(--color-border);
		}

		.diff-row-wrapper {
			display: flex;
			width: 100%;
		}

		.diff-row {
			display: flex;
			width: 100%;
			min-height: 30px; /* Minimum height for all rows */
		}

		.line {
			display: flex;
			align-items: start;
			padding: 4px 8px;
			white-space: pre-wrap;
			word-break: break-word;
			width: 100%;
			min-height: inherit;
		}

		.line-number {
			width: 40px;
			text-align: right;
			padding: 4px 8px;
			background-color: var(--color-line-bg);
			color: var(--color-text);
			border-right: 1px solid var(--color-border);
		}

		.line-wrapper {
			display: flow;
			white-space: inherit;
		}

		/* Character-level highlighting */
		.char-added {
			background-color: var(--color-added-bg);
			color: var(--color-added-text);
			border-radius: 2px;
			padding: 0 1px;
			display: inline;
			white-space: pre-wrap;
		}

		.char-deleted {
			background-color: var(--color-deleted-bg);
			color: var(--color-deleted-text);
			border-radius: 2px;
			padding: 0 1px;
			display: inline;
		}

		.empty {
			color: transparent;
		}

		/* Equal height row pairs */
		.row-pair {
			display: contents;
		}

		.row-pair > div:nth-child(1),
		.row-pair > div:nth-child(2) {
			min-height: 30px;
			position: relative;
		}

		/* For empty cells, ensure visibility and proper height */
		.empty .line {
			min-height: 100%;
			height: 100%;
		}

		.collapsed-block {
			background-color: var(--color-line-bg);
			text-align: center;
			cursor: pointer;
			padding: 6px;
			grid-column: 1 / span 2;
			border-bottom: 1px solid var(--color-border);
			color: #586069;
			font-size: 0.9em;
			user-select: none;
		}

		.collapsed-block:hover {
			background-color: #e1e4e8;
		}

		.collapsed-block svg {
			margin-right: 4px;
			vertical-align: middle;
		}

		/* Ensure proper word wrapping */
		span {
			white-space: pre-line;
		}
	`;

	@property({ type: Array })
	diffs: UiDiffComponentProps["diffs"] = [];

	@state()
	expandedBlocks: Set<string> = new Set();

	override render() {
		return html`
			<div class="diff-container" @click=${this._handleContainerClick}>
				${this.diffs.map((diff, i) => this.renderDiff(diff, `diff-${i}`))}
			</div>
		`;
	}

	// Stop event propagation to prevent parent components from collapsing
	_handleContainerClick(e: Event) {
		e.stopPropagation();
	}

	// Helper functions for character-level diffs
	// Check if words might be related by similarity
	findMatchingWord(word1: string, word2: string): boolean {
		if (!word1 || !word2) return false;

		// Simple similarity check - if words share a common substring
		// This helps identify similar words that might have just changed slightly
		const minLength = Math.min(word1.length, word2.length);
		const threshold = Math.max(1, Math.floor(minLength * 0.7)); // 70% match threshold

		for (let i = 0; i <= word1.length - threshold; i++) {
			const substr = word1.substring(i, i + threshold);
			if (word2.includes(substr)) return true;
		}
		return false;
	}

	// Find nearby added and removed parts to see if they might be related
	findRelatedParts(diffs: Change[]): Map<number, number> {
		const relatedParts = new Map<number, number>();

		for (let i = 0; i < diffs.length; i++) {
			const currentPart = diffs[i];
			if (currentPart && currentPart.removed) {
				// Find the next added part to potentially match with this removed part
				for (let j = i + 1; j < Math.min(i + 3, diffs.length); j++) {
					const nextPart = diffs[j];
					if (
						nextPart &&
						nextPart.added &&
						this.findMatchingWord(currentPart.value || "", nextPart.value || "")
					) {
						relatedParts.set(i, j);
						relatedParts.set(j, i);
						break;
					}
				}
			}
		}

		return relatedParts;
	}

	// Helper method for rendering character-level diffs with preserved whitespace
	renderDetailedDiff(text1: string, text2: string) {
		// If either string is empty, handle specially
		if (!text1) {
			return {
				before: html``,
				after: html`<span class="char-added">${text2}</span>`,
				hasChanges: true,
				hasAddedContent: true,
				hasRemovedContent: false,
			};
		}
		if (!text2) {
			return {
				before: html`<span class="char-deleted">${text1}</span>`,
				after: html``,
				hasChanges: true,
				hasAddedContent: false,
				hasRemovedContent: true,
			};
		}

		// Normalize trailing newlines to prevent false positives
		// This helps with the issue where a paragraph is marked as changed
		// just because a newline after it was removed
		const normalizedText1 = text1.replace(/\n+$/, "");
		const normalizedText2 = text2.replace(/\n+$/, "");

		// If texts are identical after normalization, no highlighting needed
		if (normalizedText1 === normalizedText2) {
			return {
				before: html`<span>${text1}</span>`,
				after: html`<span>${text2}</span>`,
				hasChanges: false,
				hasAddedContent: false,
				hasRemovedContent: false,
			};
		}

		// First, use word-level diffing to identify words
		const wordDiffs = diffWords(normalizedText1, normalizedText2, {
			ignoreCase: false,
		});

		// Find potential related parts for character-level diffs
		const relatedParts = this.findRelatedParts(wordDiffs);

		// Render each diff part with appropriate styling
		const beforeParts: unknown[] = [];
		const afterParts: unknown[] = [];
		let hasRealChanges = false;
		let hasAddedContent = false;
		let hasRemovedContent = false;

		for (let i = 0; i < wordDiffs.length; i++) {
			const part = wordDiffs[i];

			if (!part) continue;

			if (part.added) {
				// Check if this added part has a related removed part
				if (relatedParts.has(i)) {
					// Skip here - we'll handle this when processing the removed part
					hasRealChanges = true;
					hasAddedContent = true;
				} else {
					// Regular added content
					afterParts.push(
						html`<span class="char-added">${part.value || ""}</span>`,
					);
					hasRealChanges = true;
					hasAddedContent = true;
				}
			} else if (part.removed) {
				// Check if this removed part has a related added part
				if (relatedParts.has(i)) {
					const addedIndex = relatedParts.get(i);
					const addedPart =
						addedIndex !== undefined ? wordDiffs[addedIndex] : undefined;

					if (addedPart) {
						// Use character-level diffing for these related parts
						const charDiffs = diffChars(
							part.value || "",
							addedPart.value || "",
						);

						// Ensure all changes are treated as significant
						hasRemovedContent = true;
						hasAddedContent = true;

						// Process each diff part into HTML elements
						const beforeElements: unknown[] = [];
						const afterElements: unknown[] = [];

						charDiffs.forEach((charPart) => {
							if (!charPart) return;

							if (charPart.added) {
								afterElements.push(
									html`<span class="char-added">${charPart.value || ""}</span>`,
								);
							} else if (charPart.removed) {
								beforeElements.push(
									html`<span class="char-deleted"
										>${charPart.value || ""}</span
									>`,
								);
							} else {
								// Unchanged characters
								beforeElements.push(html`${charPart.value || ""}`);
								afterElements.push(html`${charPart.value || ""}`);
							}
						});

						beforeParts.push(html`${beforeElements}`);
						afterParts.push(html`${afterElements}`);

						hasRealChanges = true;
						hasRemovedContent = true;
						hasAddedContent = true;
					} else {
						// Fallback if related part is not found
						beforeParts.push(
							html`<span class="char-deleted">${part.value || ""}</span>`,
						);
						hasRealChanges = true;
						hasRemovedContent = true;
					}
				} else {
					// Regular removed content
					beforeParts.push(
						html`<span class="char-deleted">${part.value || ""}</span>`,
					);
					hasRealChanges = true;
					hasRemovedContent = true;
				}
			} else {
				// Unchanged parts
				beforeParts.push(html`<span>${part.value || ""}</span>`);
				afterParts.push(html`<span>${part.value || ""}</span>`);
			}
		}

		return {
			before: html`${beforeParts}`,
			after: html`${afterParts}`,
			hasChanges: hasRealChanges,
			hasAddedContent,
			hasRemovedContent,
		};
	}

	renderDiff(diff: UiDiffComponentProps["diffs"][0], diffId: string) {
		const before =
			diff.snapshot_content_before?.text ||
			JSON.stringify(diff.snapshot_content_before?.idPositions) ||
			"";
		const after =
			diff.snapshot_content_after?.text ||
			JSON.stringify(diff.snapshot_content_after?.idPositions) ||
			"";
		// Configure line diff with options
		const lineDiffs = diffLines(before, after, {
			ignoreWhitespace: false, // Maintain visible whitespace changes
			ignoreCase: false, // Case sensitive
			newlineIsToken: false, // Treat newlines as part of the line
			ignoreNewlineAtEof: true, // Ignore newlines at end of file
		});

		// Create aligned pairs with context and collapsible sections
		const { sections, hasChanges } = this.processChangesWithContext(
			lineDiffs,
			diffId,
		);

		// If there are no changes, we can just show a simple message
		if (!hasChanges) {
			return html`
				<div class="diff-section" @click=${this._handleContainerClick}>
					<div
						style="grid-column: 1 / span 2; padding: 8px; text-align: center; color: #586069;"
					>
						No changes found in this diff
					</div>
				</div>
			`;
		}

		// Render each section (either collapsible unchanged content or visible content)
		return html`
			<div class="diff-section" @click=${this._handleContainerClick}>
				${sections.map((section) => {
					if (
						section.type === "collapsible" &&
						!this.expandedBlocks.has(section.id)
					) {
						return html`
							<div
								class="collapsed-block"
								@click=${(e: Event) => this.toggleBlock(section.id, e)}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="currentColor"
								>
									<path
										d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"
									></path>
								</svg>
								${section.count} unchanged line${section.count !== 1 ? "s" : ""}
							</div>
						`;
					} else {
						// For visible sections or expanded collapsible sections
						if (section.type === "collapsible") {
							return html`
								<div
									class="collapsed-block"
									@click=${(e: Event) => this.toggleBlock(section.id, e)}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="currentColor"
									>
										<path
											d="M4 8a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8Z"
										></path>
									</svg>
									Collapse ${section.count} unchanged
									line${section.count !== 1 ? "s" : ""}
								</div>
								${section.rows.map((pair) => {
									// For unchanged lines, render normally
									if (!pair.left.type && !pair.right.type) {
										return html`
											<div class="row-pair">
												<div class="diff-row">
													<span class="line">${pair.left.content}</span>
												</div>
												<div class="diff-row">
													<span class="line">${pair.right.content}</span>
												</div>
											</div>
										`;
									}

									// For changed lines, do detailed word diff
									const detailedDiff = this.renderDetailedDiff(
										pair.left.content,
										pair.right.content,
									);

									return html`
										<div class="row-pair">
											<div class="diff-row">
												<div class="line line-wrapper">
													${detailedDiff.before}
												</div>
											</div>
											<div class="diff-row">
												<div class="line line-wrapper">
													${detailedDiff.after}
												</div>
											</div>
										</div>
									`;
								})}
							`;
						} else {
							return html`
								${section.rows.map((pair) => {
									// For unchanged lines, render normally
									if (!pair.left.type && !pair.right.type) {
										return html`
											<div class="row-pair">
												<div class="diff-row">
													<span class="line">${pair.left.content}</span>
												</div>
												<div class="diff-row">
													<span class="line">${pair.right.content}</span>
												</div>
											</div>
										`;
									}

									// For changed lines, do detailed word diff
									const detailedDiff = this.renderDetailedDiff(
										pair.left.content,
										pair.right.content,
									);

									return html`
										<div class="row-pair">
											<div class="diff-row">
												<div class="line line-wrapper">
													${detailedDiff.before}
												</div>
											</div>
											<div class="diff-row">
												<div class="line line-wrapper">
													${detailedDiff.after}
												</div>
											</div>
										</div>
									`;
								})}
							`;
						}
					}
				})}
			</div>
		`;
	}

	toggleBlock(blockId: string, e: Event) {
		// Prevent the event from bubbling up to parent components
		e.stopPropagation();

		if (this.expandedBlocks.has(blockId)) {
			this.expandedBlocks.delete(blockId);
		} else {
			this.expandedBlocks.add(blockId);
		}
		this.requestUpdate();
	}

	/**
	 * Process changes to create sections with context around changes
	 * Returns sections that are either visible always (changes and context)
	 * or collapsible (unchanged content beyond context)
	 */
	processChangesWithContext(changes: Change[], diffId: string) {
		// First, create the full aligned changes
		const alignedChanges = this.alignChanges(changes);

		// Set context lines: 2 above (showing "2 unchanged lines") and 1 below each change
		const contextLinesBefore = 2;
		const contextLinesAfter = 1;
		const sections: Array<{
			type: "visible" | "collapsible";
			id: string;
			rows: typeof alignedChanges;
			count: number;
		}> = [];

		// Determine which lines should be visible (changed or nearby context)
		const isChangedLine = (pair: (typeof alignedChanges)[0]) =>
			pair.left.type.includes("deleted") || pair.right.type.includes("added");

		const visibleIndices = new Set<number>();

		// First identify all changed lines
		alignedChanges.forEach((pair, index) => {
			if (isChangedLine(pair)) {
				visibleIndices.add(index);

				// Add context lines before (more above)
				for (let i = Math.max(0, index - contextLinesBefore); i < index; i++) {
					visibleIndices.add(i);
				}

				// Add context lines after (fewer below)
				for (
					let i = index + 1;
					i <= Math.min(alignedChanges.length - 1, index + contextLinesAfter);
					i++
				) {
					visibleIndices.add(i);
				}
			}
		});

		// Now create sections based on visibility
		let currentSection: (typeof sections)[0] | null = null;
		let sectionCount = 0;
		let hasChanges = false;

		// Helper to push the current section if it exists
		const pushCurrentSection = () => {
			if (currentSection && currentSection.rows.length > 0) {
				currentSection.count = currentSection.rows.length;
				sections.push(currentSection);
			}
		};

		alignedChanges.forEach((pair, index) => {
			const isVisible = visibleIndices.has(index);
			const isChanged = isChangedLine(pair);

			if (isChanged) {
				hasChanges = true;
			}

			// If this line should be visible
			if (isVisible) {
				// If we were in a collapsible section, end it
				if (currentSection && currentSection.type === "collapsible") {
					pushCurrentSection();
					currentSection = null;
				}

				// If we're not already in a visible section, start one
				if (!currentSection || currentSection.type !== "visible") {
					pushCurrentSection();
					currentSection = {
						type: "visible",
						id: `${diffId}-visible-${sectionCount++}`,
						rows: [],
						count: 0,
					};
				}
			} else {
				// This line should be collapsible
				// If we were in a visible section, end it
				if (currentSection && currentSection.type === "visible") {
					pushCurrentSection();
					currentSection = null;
				}

				// If we're not already in a collapsible section, start one
				if (!currentSection || currentSection.type !== "collapsible") {
					pushCurrentSection();
					currentSection = {
						type: "collapsible",
						id: `${diffId}-collapsible-${sectionCount++}`,
						rows: [],
						count: 0,
					};
				}
			}

			// Add the current pair to the current section
			if (currentSection) {
				currentSection.rows.push(pair);
			}
		});

		// Push the last section if it exists
		pushCurrentSection();

		return { sections, hasChanges };
	}

	/**
	 * Align changes to display related blocks side-by-side
	 */
	alignChanges(changes: Change[]) {
		// Array to hold our aligned changes
		const alignedChanges: Array<{
			left: { content: string; type: string };
			right: { content: string; type: string };
		}> = [];

		// Process the changes to align them
		let i = 0;
		while (i < changes.length) {
			const current = changes[i];

			if (!current) {
				i++;
				continue;
			}

			// Handle unchanged content - shows in both columns
			if (!current.added && !current.removed) {
				// Split by lines to process each line individually
				const lines = current.value ? current.value.split("\n") : [];

				// Keep the last line if it's empty (no trailing newline)
				const processLines =
					lines.length > 0 && lines[lines.length - 1] === ""
						? lines.slice(0, -1)
						: lines;

				processLines.forEach((line) => {
					alignedChanges.push({
						left: { content: line, type: "" },
						right: { content: line, type: "" },
					});
				});

				i++;
				continue;
			}

			// Check if we have a removed followed by an added (potential change pair)
			if (current.removed && i + 1 < changes.length && changes[i + 1]?.added) {
				const next = changes[i + 1];

				if (!next) {
					i++;
					continue;
				}

				// Split lines for both sides
				const removedLines = current.value ? current.value.split("\n") : [];
				const addedLines = next.value ? next.value.split("\n") : [];

				// Remove empty last line if it exists
				const processRemovedLines =
					removedLines.length > 0 &&
					removedLines[removedLines.length - 1] === ""
						? removedLines.slice(0, -1)
						: removedLines;

				const processAddedLines =
					addedLines.length > 0 && addedLines[addedLines.length - 1] === ""
						? addedLines.slice(0, -1)
						: addedLines;

				// Calculate the number of rows needed
				const maxLines = Math.max(
					processRemovedLines.length,
					processAddedLines.length,
				);

				// Create aligned rows
				for (let j = 0; j < maxLines; j++) {
					alignedChanges.push({
						left: {
							content:
								j < processRemovedLines.length
									? processRemovedLines[j] || ""
									: "",
							type: j < processRemovedLines.length ? "deleted" : "empty",
						},
						right: {
							content:
								j < processAddedLines.length ? processAddedLines[j] || "" : "",
							type: j < processAddedLines.length ? "added" : "empty",
						},
					});
				}

				// Skip both changes as we processed them together
				i += 2;
			} else if (current.removed) {
				// Handle removed-only lines
				const lines = current.value ? current.value.split("\n") : [];
				const processLines =
					lines.length > 0 && lines[lines.length - 1] === ""
						? lines.slice(0, -1)
						: lines;

				processLines.forEach((line) => {
					alignedChanges.push({
						left: { content: line, type: "deleted" },
						right: { content: "", type: "empty" },
					});
				});

				i++;
			} else if (current.added) {
				// Handle added-only lines
				const lines = current.value ? current.value.split("\n") : [];
				const processLines =
					lines.length > 0 && lines[lines.length - 1] === ""
						? lines.slice(0, -1)
						: lines;

				processLines.forEach((line) => {
					alignedChanges.push({
						left: { content: "", type: "empty" },
						right: { content: line, type: "added" },
					});
				});

				i++;
			} else {
				// Skip unknown change types
				i++;
			}
		}

		return alignedChanges;
	}
}