import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { diffLines } from "diff";
import type { Change } from "diff";

export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			--color-added-bg: #e6ffed;
			--color-added-text: #22863a;
			--color-deleted-bg: #ffeef0;
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
			word-break: break-all;
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

		.added {
			background-color: var(--color-added-bg);
			color: var(--color-added-text);
		}

		.deleted {
			background-color: var(--color-deleted-bg);
			color: var(--color-deleted-text);
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

	renderDiff(diff: UiDiffComponentProps["diffs"][0], diffId: string) {
		const before =
			diff.snapshot_content_before?.text ||
			JSON.stringify(diff.snapshot_content_before?.idPositions) ||
			"";
		const after =
			diff.snapshot_content_after?.text ||
			JSON.stringify(diff.snapshot_content_after?.idPositions) ||
			"";
		const lineDiffs = diffLines(before, after);

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
								${section.rows.map(
									(pair) => html`
										<div class="row-pair">
											<div class="diff-row ${pair.left.type}">
												<span class="line">${pair.left.content}</span>
											</div>
											<div class="diff-row ${pair.right.type}">
												<span class="line">${pair.right.content}</span>
											</div>
										</div>
									`,
								)}
							`;
						} else {
							return html`
								${section.rows.map(
									(pair) => html`
										<div class="row-pair">
											<div class="diff-row ${pair.left.type}">
												<span class="line">${pair.left.content}</span>
											</div>
											<div class="diff-row ${pair.right.type}">
												<span class="line">${pair.right.content}</span>
											</div>
										</div>
									`,
								)}
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

		// Context lines to show before and after each change
		const contextLines = 3;
		const sections: Array<{
			type: "visible" | "collapsible";
			id: string;
			rows: typeof alignedChanges;
			count: number;
		}> = [];

		// Determine which lines should be visible (changed or nearby context)
		const isChangedLine = (pair: (typeof alignedChanges)[0]) =>
			pair.left.type.includes("before") || pair.right.type.includes("after");

		const visibleIndices = new Set<number>();

		// First identify all changed lines
		alignedChanges.forEach((pair, index) => {
			if (isChangedLine(pair)) {
				visibleIndices.add(index);

				// Add context lines before
				for (let i = Math.max(0, index - contextLines); i < index; i++) {
					visibleIndices.add(i);
				}

				// Add context lines after
				for (
					let i = index + 1;
					i <= Math.min(alignedChanges.length - 1, index + contextLines);
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