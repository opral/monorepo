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
 * Rehype plugin that converts GitHub-style markdown alerts into HTML matching GitHub's renderer.
 *
 * It recognizes blockquotes that start with a marker like `[!NOTE]` and rewrites:
 *
 * ```md
 * > [!NOTE]
 * > Message
 * ```
 *
 * into:
 *
 * ```html
 * <div class="markdown-alert markdown-alert-note" dir="auto">
 *   <p class="markdown-alert-title" dir="auto">
 *     <svg class="octicon octicon-info mr-2" ...></svg>
 *     Note
 *   </p>
 *   <p dir="auto">Message</p>
 * </div>
 * ```
 *
 * @example
 * unified().use(remarkRehype).use(rehypeGithubAlerts)
 */
export const rehypeGithubAlerts: Plugin<[], any> = () => (tree: any) => {
  visit(tree, "element", (node: any, index: number | undefined, parent: any) => {
    if (!parent || index == null) return;
    if (node.tagName !== "blockquote") return;

    const children = Array.isArray(node.children) ? node.children : [];
    const firstParagraphIndex = children.findIndex(
      (child: any) => child?.type === "element" && child.tagName === "p",
    );
    if (firstParagraphIndex === -1) return;

    const firstParagraph = children[firstParagraphIndex];
    const rawText = getTextContent(firstParagraph).trim();
    const match = rawText.match(
      /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s+(.*))?$/i,
    );
    if (!match) return;

    const alertType = match[1];
    if (!alertType) {
      return;
    }
    const kind = alertType.toLowerCase() as AlertKind;
    if (!ALERT_KINDS.has(kind)) {
      return;
    }

    const titleOverride = match[2]?.trim();

    const markerSpan = {
      type: "element",
      tagName: "span",
      properties: {
        "data-mwc-alert-marker": "",
      },
      children: [
        {
          type: "text",
          value: `[!${alertType.toUpperCase()}]`,
        },
      ],
    };

    const newFirstParagraph = {
      ...firstParagraph,
      children: titleOverride
        ? [
            markerSpan,
            { type: "text", value: ` ${titleOverride}` },
          ]
        : [markerSpan],
    };

    children.splice(firstParagraphIndex, 1, newFirstParagraph);

    const properties = (node.properties ||= {});
    properties["data-mwc-alert"] = kind;
  });
};

function getTextContent(node: any): string {
  if (!node) return "";
  if (node.type === "text") return String(node.value ?? "");
  if (!Array.isArray(node.children)) return "";
  return node.children.map(getTextContent).join("");
}
