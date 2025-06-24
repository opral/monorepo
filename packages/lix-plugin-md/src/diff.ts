import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { diffLines } from "diff";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
import { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
import { serializeMarkdown } from "./utilities/serializeMarkdown.js";
import type { MdAstNode } from "./utilities/parseMarkdown.js";

export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			--color-added-bg: #e6ffed;
			--color-added-text: #22863a;
			--color-removed-bg: #ffeef0;
			--color-removed-text: #b31d28;
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

		.diff-row {
			display: flex;
			width: 100%;
		}

		.column {
			flex: 1;
			display: flex;
			flex-direction: column;
			border-right: 1px solid var(--color-border);
		}

		.line {
			display: flex;
			align-items: center;
			padding: 4px 8px;
			white-space: pre-wrap;
			word-break: break-all;
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

		.removed {
			background-color: var(--color-removed-bg);
			color: var(--color-removed-text);
		}

		.empty {
			visibility: hidden;
		}
	`;

	@property({ type: Array })
	diffs: UiDiffComponentProps["diffs"] = [];

	override render() {
		const orderDiff = this.diffs.find(
			(diff) => diff.schema_key === MarkdownRootSchemaV1["x-lix-key"],
		);

		const contentDiffs = this.diffs
			.filter((diff) => diff.schema_key === MarkdownNodeSchemaV1["x-lix-key"])
			.sort((a, b) => {
				// Sort by position in order array if available
				if (orderDiff?.snapshot_content_after?.order) {
					const posA = orderDiff.snapshot_content_after.order.indexOf(a.entity_id);
					const posB = orderDiff.snapshot_content_after.order.indexOf(b.entity_id);
					if (posA !== -1 && posB !== -1) {
						return posA - posB;
					}
				}
				// Fall back to entity_id comparison
				return a.entity_id.localeCompare(b.entity_id);
			});

		return html`
			<div class="diff-container">
				${contentDiffs.map((diff) => this.renderDiff(diff))}
			</div>
		`;
	}

	renderDiff(diff: UiDiffComponentProps["diffs"][0]) {
		// Convert MD-AST nodes to readable markdown for diff display
		const before = this.getNodeContent(diff.snapshot_content_before);
		const after = this.getNodeContent(diff.snapshot_content_after);
		const lineDiffs = diffLines(before, after);

		// Track left and right columns
		const leftColumn: unknown[] = [];
		const rightColumn: unknown[] = [];

		lineDiffs.forEach((part) => {
			const isAdded = part.added;
			const isRemoved = part.removed;
			const className = isAdded ? "added" : isRemoved ? "removed" : "";

			if (isRemoved) {
				// Removed lines go only in the left column
				leftColumn.push(html`
					<div class="diff-row ${className}">
						<span class="line">${part.value}</span>
					</div>
				`);
				rightColumn.push(html`<div class="diff-row empty"></div>`);
			} else if (isAdded) {
				// Added lines go only in the right column
				rightColumn.push(html`
					<div class="diff-row ${className}">
						<span class="line">${part.value}</span>
					</div>
				`);
				leftColumn.push(html`<div class="diff-row empty"></div>`);
			} else {
				// Unchanged lines go in both columns
				leftColumn.push(html`
					<div class="diff-row">
						<span class="line">${part.value}</span>
					</div>
				`);
				rightColumn.push(html`
					<div class="diff-row">
						<span class="line">${part.value}</span>
					</div>
				`);
			}
		});

		return html`
			<div class="diff-row">
				<div class="column">${leftColumn}</div>
				<div class="column">${rightColumn}</div>
			</div>
		`;
	}

	private getNodeContent(node: any): string {
		if (!node) return "";
		
		// Handle root order changes
		if (node.order) {
			return `Order: [${node.order.join(", ")}]`;
		}

		// Handle MD-AST nodes - serialize them to markdown
		if (node.type && node.mdast_id) {
			try {
				const tempAst = {
					type: "root" as const,
					children: [node as MdAstNode]
				};
				return serializeMarkdown(tempAst, { skip_id_comments: true }).trim();
			} catch {
				// Fallback to JSON representation
				return JSON.stringify(node, null, 2);
			}
		}

		// Fallback for other content
		return typeof node === "string" ? node : JSON.stringify(node, null, 2);
	}
}
