import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { renderHtmlDiff } from "@lix-js/html-diff";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
import { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
import type { MdAstNode } from "./utilities/parseMarkdown.js";

export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			--color-border: #e1e4e8;
			--color-text: #24292e;
		}

		/* Import lix HTML diff default styles */
		@import "@lix-js/html-diff/default.css";

		.diff-container {
			display: flex;
			flex-direction: column;
			border: 1px solid var(--color-border);
			border-radius: 6px;
			overflow: hidden;
			font-family: system-ui, sans-serif;
		}

		.entity-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 8px;
		}

		.entity-list * {
			margin-top: 0;
			margin-bottom: 0;
		}

		/* Enhance lix HTML diff classes */
		.diff-created {
			color: #080;
			background: #efe;
			// border-left: 2px solid #080;
		}

		.diff-updated {
			color: #f60;
			background: #ffc;
			// border-left: 2px solid #f60;
		}

		.diff-deleted {
			color: #b00;
			background: #fee;
			// border-left: 2px solid #b00;
			opacity: 0.7;
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
			.filter((diff) => {
				// Only include entities that are in either the before or after order arrays
				const beforeOrder = orderDiff?.snapshot_content_before?.order;
				const afterOrder = orderDiff?.snapshot_content_after?.order;

				// If no order arrays exist, don't show any content diffs
				if (
					(!beforeOrder || beforeOrder.length === 0) &&
					(!afterOrder || afterOrder.length === 0)
				) {
					return false;
				}

				// Include entity if it's in either order array (handles additions, modifications, and deletions)
				const inBeforeOrder = beforeOrder?.includes(diff.entity_id) || false;
				const inAfterOrder = afterOrder?.includes(diff.entity_id) || false;

				return inBeforeOrder || inAfterOrder;
			});

		// Create combined order array that preserves positions from both before and after
		const combinedOrder = this.createCombinedOrder(
			orderDiff?.snapshot_content_before?.order || [],
			orderDiff?.snapshot_content_after?.order || []
		);

		// Sort content diffs by combined order
		const sortedContentDiffs = contentDiffs.sort((a, b) => {
			const posA = combinedOrder.indexOf(a.entity_id);
			const posB = combinedOrder.indexOf(b.entity_id);
			
			if (posA !== -1 && posB !== -1) {
				return posA - posB;
			}
			
			// Fall back to entity_id comparison for entities not in order arrays
			return a.entity_id.localeCompare(b.entity_id);
		});

		// Generate HTML diff for all entities
		const diffHtml = this.generateHtmlDiff(sortedContentDiffs);

		return html`
			<div class="diff-container">
				<div class="entity-list">${this.renderEntityList(diffHtml)}</div>
			</div>
		`;
	}

	private generateHtmlDiff(
		contentDiffs: UiDiffComponentProps["diffs"],
	): string {
		// Group diffs by before/after state
		const beforeEntities = new Map<string, any>();
		const afterEntities = new Map<string, any>();

		contentDiffs.forEach((diff) => {
			if (diff.snapshot_content_before) {
				beforeEntities.set(diff.entity_id, diff.snapshot_content_before);
			}
			if (diff.snapshot_content_after) {
				afterEntities.set(diff.entity_id, diff.snapshot_content_after);
			}
		});

		// Convert entities to HTML
		const beforeHtml = this.entitiesToHtml(beforeEntities);
		const afterHtml = this.entitiesToHtml(afterEntities);

		// Generate HTML diff using lix HTML diff
		try {
			return renderHtmlDiff({ beforeHtml, afterHtml });
		} catch (error) {
			console.error("HTML diff generation failed:", error);
			// Fallback to simple after HTML
			return afterHtml;
		}
	}

	private entitiesToHtml(entities: Map<string, any>): string {
		const htmlParts: string[] = [];

		entities.forEach((entity, entityId) => {
			const html = this.convertEntityToHtml(entity, entityId);
			if (html) {
				htmlParts.push(html);
			}
		});

		return htmlParts.join("\n");
	}

	private convertEntityToHtml(entity: any, entityId: string): string {
		if (!entity || !entity.type) {
			return "";
		}

		try {
			// Handle entities with direct value property first
			if (entity.value) {
				if (entity.type === "text") {
					// Text nodes should render their value directly
					return `<span data-diff-key="${entityId}" data-diff-mode="words">${entity.value}</span>`;
				} else {
					// Other nodes with direct values (like code blocks, html, etc.)
					const tagName = this.getTagForType(entity.type);
					return `<${tagName} data-diff-key="${entityId}" data-diff-mode="words">${entity.value}</${tagName}>`;
				}
			}

			// Handle entities with children
			if (entity.children && entity.children.length > 0) {
				// Create temporary AST with single entity
				const tempAst = {
					type: "root" as const,
					children: [entity as MdAstNode],
				};

				// Convert to HTML AST
				const hast = toHast(tempAst as any);
				if (!hast) {
					return "";
				}

				// Convert to HTML string
				const html = toHtml(hast);

				// Add data-diff-key attribute using entity ID
				return this.addDataDiffKey(html, entityId);
			}

			// Fallback for entities without value or children
			const tagName = this.getTagForType(entity.type);
			return `<${tagName} data-diff-key="${entityId}" data-diff-mode="words"></${tagName}>`;
		} catch (error) {
			console.error("Entity to HTML conversion failed:", error);
			return `<div data-diff-key="${entityId}">${JSON.stringify(entity)}</div>`;
		}
	}

	private getTagForType(type: string): string {
		switch (type) {
			case "paragraph":
				return "p";
			case "heading":
				return "h1"; // Could be h1-h6 based on depth
			case "code":
				return "code";
			case "html":
				return "div";
			case "text":
				return "span";
			case "emphasis":
				return "em";
			case "strong":
				return "strong";
			case "link":
				return "a";
			case "image":
				return "img";
			case "list":
				return "ul";
			case "listItem":
				return "li";
			case "blockquote":
				return "blockquote";
			case "break":
				return "br";
			case "thematicBreak":
				return "hr";
			case "inlineCode":
				return "code";
			case "delete":
				return "del";
			default:
				return "div";
		}
	}

	private createCombinedOrder(beforeOrder: string[], afterOrder: string[]): string[] {
		const combinedOrder: string[] = [];
		const afterSet = new Set(afterOrder);
		
		// Start with afterOrder as the base structure
		for (const entityId of afterOrder) {
			combinedOrder.push(entityId);
		}
		
		// Insert deleted entities (from before but not in after) at their original positions
		for (let i = 0; i < beforeOrder.length; i++) {
			const entityId = beforeOrder[i]!; // Array access is guaranteed to be defined
			
			// Skip if entity is already in the combined order (exists in after)
			if (afterSet.has(entityId)) {
				continue;
			}
			
			// Find the insertion point by looking for the next entity that exists in both arrays
			let insertionIndex = combinedOrder.length; // Default to end
			
			for (let j = i + 1; j < beforeOrder.length; j++) {
				const nextEntityId = beforeOrder[j]!; // Array access is guaranteed to be defined
				const nextEntityIndexInCombined = combinedOrder.indexOf(nextEntityId);
				
				if (nextEntityIndexInCombined !== -1) {
					insertionIndex = nextEntityIndexInCombined;
					break;
				}
			}
			
			// Insert the deleted entity at the calculated position
			combinedOrder.splice(insertionIndex, 0, entityId);
		}
		
		return combinedOrder;
	}

	private addDataDiffKey(html: string, entityId: string): string {
		// Add data-diff-key to the first HTML element
		const tagMatch = html.match(/^<([a-zA-Z][^>\s]*)(\s[^>]*)?>/);
		if (tagMatch) {
			const [fullMatch, tagName, attributes = ""] = tagMatch;
			const newAttributes = attributes.includes("data-diff-key")
				? attributes
				: `${attributes} data-diff-key="${entityId}" data-diff-mode="words"`;
			return html.replace(fullMatch, `<${tagName}${newAttributes}>`);
		}
		return html;
	}

	private renderEntityList(diffHtml: string): unknown {
		// Parse the HTML diff result and render as template
		// For now, render as unsafe HTML - in production, this should be sanitized
		return html`<div .innerHTML=${diffHtml}></div>`;
	}
}
