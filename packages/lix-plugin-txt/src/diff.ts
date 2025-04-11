import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { diffLines, diffWords, diffChars } from "diff";
import type { Change } from "diff";

type AlignedChange = {
	left: { content: string; type: string };
	right: { content: string; type: string };
};

type DiffSection = {
	type: "visible" | "collapsible";
	id: string;
	rows: AlignedChange[];
	count: number;
};

type DetailedDiffResult = {
	before: unknown;
	after: unknown;
	hasChanges: boolean;
	hasAddedContent: boolean;
	hasRemovedContent: boolean;
};

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

			/* Enhanced colors for inline view */
			--color-added-bg-inline: rgba(46, 160, 67, 0.2);
			--color-deleted-bg-inline: rgba(248, 81, 73, 0.2);
		}

		.diff-container {
			display: flex;
			flex-direction: column;
			border: 1px solid var(--color-border);
			border-radius: 6px;
			overflow: hidden;
			font-family: "Courier New", monospace;
			container-type: inline-size;
			container-name: diff;
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
			position: relative;
		}

		/* For empty cells, ensure visibility and proper height */
		.empty .line {
			min-height: 100%;
			height: 100%;
		}

		.collapsed-block {
			background-color: var(--color-line-bg);
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

		/* Container query for smaller container widths */
		@container diff (max-width: 600px) {
			.diff-section {
				display: flex;
				flex-direction: column;
			}

			.row-pair {
				display: block;
				margin-bottom: 8px;
				padding-bottom: 4px;
			}

			/* Hide duplicate content in inline mode */
			.row-pair > div.diff-row:nth-child(2) {
				display: none;
			}

			/* Adjust collapsed block for mobile */
			.collapsed-block {
				grid-column: unset;
				width: 100%;
				display: flex;
				align-items: center;
				padding-left: 0.5rem;
			}

			.collapsed-text {
				margin-left: 4px;
				white-space: normal;
				word-break: break-word;
				hyphens: auto;
				display: inline-block;
				width: 100%;
				max-width: calc(100% - 30px);
			}

			/* Expand line-wrapper to full width */
			.line-wrapper {
				width: 100%;
			}

			/* Enhanced highlighting for inline view */
			.char-added {
				background-color: var(--color-added-bg-inline);
				border-radius: 3px;
				padding: 0 2px;
				margin: 0 1px;
			}

			.char-deleted {
				background-color: var(--color-deleted-bg-inline);
				border-radius: 3px;
				padding: 0 2px;
				margin: 0 1px;
				text-decoration: line-through;
				text-decoration-color: var(--color-deleted-text);
				opacity: 0.85;
			}
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
			if (word2.includes(word1.substring(i, i + threshold))) return true;
		}
		return false;
	}

	findRelatedParts(diffs: Change[]): Map<number, number> {
		const relatedParts = new Map<number, number>();

		for (let i = 0; i < diffs.length; i++) {
			const currentPart = diffs[i];
			if (!currentPart?.removed) continue;

			// Find the next added part to potentially match with this removed part
			for (let j = i + 1; j < Math.min(i + 3, diffs.length); j++) {
				const nextPart = diffs[j];
				if (
					nextPart?.added &&
					this.findMatchingWord(currentPart.value || "", nextPart.value || "")
				) {
					relatedParts.set(i, j);
					relatedParts.set(j, i);
					break;
				}
			}
		}

		return relatedParts;
	}

	renderDetailedDiff(text1: string, text2: string): DetailedDiffResult {
		// Handle empty strings
		if (!text1) {
			return {
				before: html``,
				after: text2 ? html`<span class="char-added">${text2}</span>` : html``,
				hasChanges: true,
				hasAddedContent: true,
				hasRemovedContent: false,
			};
		}

		if (!text2) {
			return {
				before: text1
					? html`<span class="char-deleted">${text1}</span>`
					: html``,
				after: html``,
				hasChanges: true,
				hasAddedContent: false,
				hasRemovedContent: true,
			};
		}

		// Normalize trailing newlines to prevent false positives
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

		// Word-level diffing to identify words
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
				if (relatedParts.has(i)) {
					// Skip here - we'll handle this when processing the removed part
					hasRealChanges = true;
					hasAddedContent = true;
				} else {
					// Regular added content
					if (part.value) {
						afterParts.push(
							html`<span class="char-added">${part.value}</span>`,
						);
					}
					hasRealChanges = true;
					hasAddedContent = true;
				}
			} else if (part.removed) {
				if (relatedParts.has(i)) {
					const addedIndex = relatedParts.get(i);
					const addedPart =
						addedIndex !== undefined ? wordDiffs[addedIndex] : undefined;

					if (addedPart) {
						// Use character-level diffing for related parts
						const charDiffs = diffChars(
							part.value || "",
							addedPart.value || "",
						);

						// Process character differences
						const [beforeElems, afterElems] = this.processCharDiffs(charDiffs);

						beforeParts.push(html`${beforeElems}`);
						afterParts.push(html`${afterElems}`);

						hasRealChanges = hasRemovedContent = hasAddedContent = true;
					} else {
						// Fallback if related part is not found
						if (part.value) {
							beforeParts.push(
								html`<span class="char-deleted">${part.value}</span>`,
							);
						}
						hasRealChanges = hasRemovedContent = true;
					}
				} else {
					// Regular removed content
					if (part.value) {
						beforeParts.push(
							html`<span class="char-deleted">${part.value}</span>`,
						);
					}
					hasRealChanges = hasRemovedContent = true;
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

	processCharDiffs(charDiffs: Change[]): [unknown[], unknown[]] {
		const beforeElements: unknown[] = [];
		const afterElements: unknown[] = [];

		charDiffs.forEach((charPart) => {
			if (!charPart) return;

			if (charPart.added && charPart.value) {
				afterElements.push(
					html`<span class="char-added">${charPart.value}</span>`,
				);
			} else if (charPart.removed && charPart.value) {
				beforeElements.push(
					html`<span class="char-deleted">${charPart.value}</span>`,
				);
			} else {
				// Unchanged characters
				beforeElements.push(html`${charPart.value || ""}`);
				afterElements.push(html`${charPart.value || ""}`);
			}
		});

		return [beforeElements, afterElements];
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

		// If there are no changes, show a simple message
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

		return html`
			<div class="diff-section" @click=${this._handleContainerClick}>
				${sections.map((section) => this.renderSection(section))}
			</div>
		`;
	}

	renderSection(section: DiffSection) {
		if (
			section.type === "collapsible" &&
			!this.expandedBlocks.has(section.id)
		) {
			return this.renderCollapsedBlock(section);
		} else if (section.type === "collapsible") {
			return this.renderExpandedBlock(section);
		} else {
			return this.renderVisibleSection(section);
		}
	}

	renderCollapsedBlock(section: DiffSection) {
		return html`
			<div
				class="collapsed-block"
				@click=${(e: Event) => this.toggleBlock(section.id, e)}
			>
				<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
					<path
						d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"
					></path>
				</svg>
				<span class="collapsed-text"
					>${section.count}
					unchanged${section.count > 1 ? " lines" : " line"}</span
				>
			</div>
		`;
	}

	renderExpandedBlock(section: DiffSection) {
		return html`
			<div
				class="collapsed-block"
				@click=${(e: Event) => this.toggleBlock(section.id, e)}
			>
				<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
					<path
						d="M4 8a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8Z"
					></path>
				</svg>
				<span class="collapsed-text"
					>Collapse
					${section.count}${section.count > 1 ? " lines" : " line"}</span
				>
			</div>
			${section.rows.map((pair) => this.renderDiffRow(pair))}
		`;
	}

	renderVisibleSection(section: DiffSection) {
		return html`${section.rows.map((pair) => this.renderDiffRow(pair))}`;
	}

	renderDiffRow(pair: AlignedChange) {
		// For unchanged lines, render normally
		if (!pair.left.type && !pair.right.type) {
			return html`
				<div class="row-pair">
					<div class="diff-row unchanged">
						<span class="line">${pair.left.content}</span>
					</div>
					<div class="diff-row unchanged">
						<span class="line">${pair.right.content}</span>
					</div>
				</div>
			`;
		}

		// For mobile view, we'll combine both sides for the char-level diff
		// This creates a unified view with inline highlighting
		const detailedDiff = this.renderInlineDiff(
			pair.left.content,
			pair.right.content,
		);

		return html`
			<div class="row-pair">
				<div class="diff-row ${pair.left.type || ""}">
					<div class="line line-wrapper">${detailedDiff}</div>
				</div>
				<div class="diff-row ${pair.right.type || ""}">
					<div class="line line-wrapper">${detailedDiff}</div>
				</div>
			</div>
		`;
	}

	renderInlineDiff(text1: string, text2: string) {
		// Handle empty strings
		if (!text1) {
			return text2 ? html`<span class="char-added">${text2}</span>` : html``;
		}

		if (!text2) {
			return text1 ? html`<span class="char-deleted">${text1}</span>` : html``;
		}

		// Normalize trailing newlines to prevent false positives
		const normalizedText1 = text1.replace(/\n+$/, "");
		const normalizedText2 = text2.replace(/\n+$/, "");

		// If texts are identical after normalization, no highlighting needed
		if (normalizedText1 === normalizedText2) {
			return html`<span>${text1}</span>`;
		}

		// Character-level diffing
		const charDiffs = diffChars(normalizedText1, normalizedText2);

		// Process and render the character differences
		const combinedElements: unknown[] = [];

		charDiffs.forEach((part) => {
			if (!part) return;

			if (part.added && part.value) {
				combinedElements.push(
					html`<span class="char-added">${part.value}</span>`,
				);
			} else if (part.removed && part.value) {
				combinedElements.push(
					html`<span class="char-deleted">${part.value}</span>`,
				);
			} else {
				// Unchanged parts
				combinedElements.push(html`<span>${part.value || ""}</span>`);
			}
		});

		return html`${combinedElements}`;
	}

	toggleBlock(blockId: string, e: Event) {
		e.stopPropagation();

		if (this.expandedBlocks.has(blockId)) {
			this.expandedBlocks.delete(blockId);
		} else {
			this.expandedBlocks.add(blockId);
		}
		this.requestUpdate();
	}

	processChangesWithContext(changes: Change[], diffId: string) {
		const alignedChanges = this.alignChanges(changes);
		const contextLinesBefore = 2;
		const contextLinesAfter = 1;

		// Determine which lines should be visible (changed or nearby context)
		const isChangedLine = (pair: AlignedChange) =>
			pair.left.type.includes("deleted") || pair.right.type.includes("added");

		const visibleIndices = this.determineVisibleLines(
			alignedChanges,
			isChangedLine,
			contextLinesBefore,
			contextLinesAfter,
		);

		// Process aligned changes into sections
		const result = this.createSections(
			alignedChanges,
			visibleIndices,
			isChangedLine,
			diffId,
		);

		return result;
	}

	determineVisibleLines(
		alignedChanges: AlignedChange[],
		isChangedLine: (pair: AlignedChange) => boolean,
		contextLinesBefore: number,
		contextLinesAfter: number,
	): Set<number> {
		const visibleIndices = new Set<number>();

		alignedChanges.forEach((pair, index) => {
			if (isChangedLine(pair)) {
				visibleIndices.add(index);

				// Add context lines before
				for (let i = Math.max(0, index - contextLinesBefore); i < index; i++) {
					visibleIndices.add(i);
				}

				// Add context lines after
				for (
					let i = index + 1;
					i <= Math.min(alignedChanges.length - 1, index + contextLinesAfter);
					i++
				) {
					visibleIndices.add(i);
				}
			}
		});

		return visibleIndices;
	}

	createSections(
		alignedChanges: AlignedChange[],
		visibleIndices: Set<number>,
		isChangedLine: (pair: AlignedChange) => boolean,
		diffId: string,
	) {
		const sections: DiffSection[] = [];
		let currentSection: DiffSection | null = null;
		let sectionCount = 0;
		let hasChanges = false;

		const pushCurrentSection = () => {
			if (currentSection?.rows.length) {
				currentSection.count = currentSection.rows.length;
				sections.push(currentSection);
			}
		};

		alignedChanges.forEach((pair, index) => {
			const isVisible = visibleIndices.has(index);

			if (isChangedLine(pair)) {
				hasChanges = true;
			}

			if (isVisible) {
				// Switch from collapsible to visible section if needed
				if (currentSection?.type === "collapsible") {
					pushCurrentSection();
					currentSection = null;
				}

				// Start a new visible section if needed
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
				// Switch from visible to collapsible section if needed
				if (currentSection?.type === "visible") {
					pushCurrentSection();
					currentSection = null;
				}

				// Start a new collapsible section if needed
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

		// Push the final section
		pushCurrentSection();

		return { sections, hasChanges };
	}

	alignChanges(changes: Change[]): AlignedChange[] {
		const alignedChanges: AlignedChange[] = [];

		let i = 0;
		while (i < changes.length) {
			const current = changes[i];

			if (!current) {
				i++;
				continue;
			}

			if (!current.added && !current.removed) {
				// Process unchanged content
				this.processUnchangedContent(current, alignedChanges);
				i++;
			} else if (
				current.removed &&
				i + 1 < changes.length &&
				changes[i + 1]?.added
			) {
				// Process change pair (removed + added)
				this.processChangePair(current, changes[i + 1]!, alignedChanges);
				i += 2;
			} else if (current.removed) {
				// Process removed-only content
				this.processRemovedContent(current, alignedChanges);
				i++;
			} else if (current.added) {
				// Process added-only content
				this.processAddedContent(current, alignedChanges);
				i++;
			} else {
				i++;
			}
		}

		return alignedChanges;
	}

	processUnchangedContent(content: Change, alignedChanges: AlignedChange[]) {
		const lines = content.value ? content.value.split("\n") : [];
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
	}

	processChangePair(
		removed: Change,
		added: Change,
		alignedChanges: AlignedChange[],
	) {
		// Split lines for both sides
		const removedLines = removed.value ? removed.value.split("\n") : [];
		const addedLines = added.value ? added.value.split("\n") : [];

		// Remove empty last lines if they exist
		const processRemovedLines =
			removedLines.length > 0 && removedLines[removedLines.length - 1] === ""
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
						j < processRemovedLines.length ? processRemovedLines[j] || "" : "",
					type: j < processRemovedLines.length ? "deleted" : "empty",
				},
				right: {
					content:
						j < processAddedLines.length ? processAddedLines[j] || "" : "",
					type: j < processAddedLines.length ? "added" : "empty",
				},
			});
		}
	}

	processRemovedContent(content: Change, alignedChanges: AlignedChange[]) {
		const lines = content.value ? content.value.split("\n") : [];
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
	}

	processAddedContent(content: Change, alignedChanges: AlignedChange[]) {
		const lines = content.value ? content.value.split("\n") : [];
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
	}
}