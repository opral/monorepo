import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { diffLines } from "diff";
import type { Change } from "diff";

export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			--color-after-bg: #e6ffed;
			--color-after-text: #22863a;
			--color-before-bg: #ffeef0;
			--color-before-text: #b31d28;
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

		.after {
			background-color: var(--color-after-bg);
			color: var(--color-after-text);
		}

		.before {
			background-color: var(--color-before-bg);
			color: var(--color-before-text);
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
	`;

	@property({ type: Array })
	diffs: UiDiffComponentProps["diffs"] = [];

	override render() {
		return html`
			<div class="diff-container">
				${this.diffs.map((diff) => this.renderDiff(diff))}
			</div>
		`;
	}

	renderDiff(diff: UiDiffComponentProps["diffs"][0]) {
		const before =
			diff.snapshot_content_before?.text ||
			JSON.stringify(diff.snapshot_content_before?.idPositions) ||
			"";
		const after =
			diff.snapshot_content_after?.text ||
			JSON.stringify(diff.snapshot_content_after?.idPositions) ||
			"";
		const lineDiffs = diffLines(before, after);

		// Create aligned pairs for side-by-side comparison
		const alignedDiffs = this.alignChanges(lineDiffs);

		// Each row pair contains a left and right cell
		return html`
			<div class="diff-section">
				${alignedDiffs.map(
					(pair, index) => html`
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
			</div>
		`;
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
							type: j < processRemovedLines.length ? "before" : "empty before",
						},
						right: {
							content:
								j < processAddedLines.length ? processAddedLines[j] || "" : "",
							type: j < processAddedLines.length ? "after" : "empty after",
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
						left: { content: line, type: "before" },
						right: { content: "", type: "empty after" },
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
						left: { content: "", type: "empty before" },
						right: { content: line, type: "after" },
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