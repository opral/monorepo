import path from "node:path";
import { visit } from "unist-util-visit";
import type { Code, Parent } from "mdast";
import type { RspressPlugin } from "@rspress/core";

type MdxJsxFlowElement = {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: Array<{
    type: "mdxJsxAttribute";
    name: string;
    value: string;
  }>;
  children: [];
  data?: Record<string, unknown>;
};

export const mermaidComponentPath = path.join(
  __dirname,
  "../src/docs/components/Mermaid.tsx",
);

/**
 * Remark plugin that converts mermaid code fences into MDX components.
 *
 * @example
 * remarkMermaid();
 */
export const remarkMermaid = () => (tree: unknown) => {
  visit(tree, "code", (node: Code, index, parent) => {
    if (
      node.lang !== "mermaid" ||
      parent === null ||
      parent === undefined ||
      typeof index !== "number"
    ) {
      return;
    }

    const mermaidNode: MdxJsxFlowElement = {
      type: "mdxJsxFlowElement",
      name: "Mermaid",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "code",
          value: node.value,
        },
      ],
      children: [],
      data: {
        _mdxExplicitJsx: true,
      },
    };

    (parent as Parent).children.splice(index, 1, mermaidNode);
  });
};

/**
 * Transforms ```mermaid code fences into a Mermaid React component so diagrams render at runtime.
 *
 * @example
 * mermaidPlugin();
 */
export function mermaidPlugin(): RspressPlugin {
  return {
    name: "local-mermaid",
    markdown: {
      globalComponents: [mermaidComponentPath],
      remarkPlugins: [remarkMermaid],
    },
  };
}
