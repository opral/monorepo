import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type AlertKind = "note" | "tip" | "important" | "warning" | "caution";

const ALERT_KINDS = new Set<AlertKind>([
	"note",
	"tip",
	"important",
	"warning",
	"caution",
]);

/**
 * Remark plugin that recognizes GitHub-style alert blockquotes.
 *
 * It annotates the blockquote with `data-mwc-alert` and injects a marker span
 * as the first child of the first paragraph. Inline markdown inside the
 * blockquote remains intact.
 *
 * Supports both:
 * - Marker only:
 *   `> [!NOTE]`
 *   `> Body`
 * - Marker with title on same line:
 *   `> [!TIP] Title`
 *   `> Body`
 *
 * If the marker and body are in the same paragraph, the plugin splits the
 * paragraph at the first newline so the title stays on its own line.
 *
 * @example
 * > [!NOTE]
 * > This is `code`
 */
export const remarkGithubAlerts: Plugin<[], any> = () => (tree: any) => {
	visit(tree, "blockquote", (node: any) => {
		const children = Array.isArray(node.children) ? node.children : [];
		if (children.length === 0) return;

		const firstParagraph = children.find((child: any) => child?.type === "paragraph");
		if (!firstParagraph) return;

		const paragraphChildren = Array.isArray(firstParagraph.children)
			? firstParagraph.children
			: [];
		const firstTextNodeIndex = paragraphChildren.findIndex(
			(child: any) =>
				child?.type === "text" &&
				typeof child.value === "string" &&
				child.value.trim().length > 0
		);
		if (firstTextNodeIndex === -1) return;
		const firstTextNode = paragraphChildren[firstTextNodeIndex];

		const raw = String(firstTextNode.value);
		const markerMatch = raw.match(
			/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/i
		);
		if (!markerMatch) return;

		const alertType = markerMatch[1];
		if (!alertType) return;
		const kind = alertType.toLowerCase() as AlertKind;
		if (!ALERT_KINDS.has(kind)) return;

		const afterMarker = markerMatch[2] ?? "";
		const splitIndex = afterMarker.indexOf("\n");
		const titleLine =
			splitIndex === -1 ? afterMarker : afterMarker.slice(0, splitIndex);
		const restLine =
			splitIndex === -1 ? "" : afterMarker.slice(splitIndex + 1);

		// Update the marker text node to remove marker and keep title line.
		firstTextNode.value = titleLine.trimEnd();

		// Inject marker span at start of first paragraph via raw HTML.
		firstParagraph.children = [
			{
				type: "html",
				value: `<span data-mwc-alert-marker>[!${alertType.toUpperCase()}]</span>`,
			},
			...(titleLine.trim() ? [{ type: "text", value: " " }] : []),
			...paragraphChildren,
		];

		// If there is remaining content on the same paragraph line (after newline),
		// split it into a new paragraph inserted right after the first paragraph.
		if (restLine.trim()) {
			const newParagraph = {
				type: "paragraph",
				children: [{ type: "text", value: restLine.trimStart() }],
			};
			const firstIndex = children.indexOf(firstParagraph);
			if (firstIndex !== -1) {
				children.splice(firstIndex + 1, 0, newParagraph);
				node.children = children;
			}
		}

		const data = (node.data ||= {});
		const hProperties = (data.hProperties ||= {}) as Record<string, any>;
		hProperties["data-mwc-alert"] = kind;
	});
};
