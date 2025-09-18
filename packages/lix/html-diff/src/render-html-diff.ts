import { diffWords } from "diff";
import { parse } from "parse5";

type Node = ElementNode | TextNode;

type ElementNode = {
  type: "element";
  tagName: string;
  attrs: Record<string, string>;
  children: Node[];
  parent: ElementNode | null;
};

type TextNode = {
  type: "text";
  value: string;
  parent: ElementNode | null;
};

type Tree = {
  roots: Node[];
  elementsById: Map<string, ElementNode>;
  order: ElementNode[];
  significantRootCount: number;
};

function buildTree(html: string, diffAttr: string): Tree {
  const doc = parse(html) as any;
  const htmlNode = doc.childNodes.find(
    (n: any) => n.nodeName === "html",
  ) as any;
  const bodyNode = htmlNode?.childNodes?.find(
    (n: any) => n.nodeName === "body",
  ) as any;

  const elementsById = new Map<string, ElementNode>();
  const order: ElementNode[] = [];
  const roots: Node[] = [];

  const convert = (node: any, parent: ElementNode | null): Node | null => {
    if (node.nodeName === "#text") {
      return { type: "text", value: node.value ?? "", parent };
    }
    if (node.nodeName.startsWith("#")) return null;

    const attrs: Record<string, string> = {};
    if (Array.isArray(node.attrs)) {
      for (const attr of node.attrs) {
        attrs[attr.name] = attr.value;
      }
    }
    const element: ElementNode = {
      type: "element",
      tagName: node.tagName,
      attrs,
      children: [],
      parent,
    };
    const convertedChildren: Node[] = [];
    for (const childNode of node.childNodes ?? []) {
      const converted = convert(childNode, element);
      if (converted) convertedChildren.push(converted);
    }
    element.children = convertedChildren;

    const id = attrs[diffAttr];
    if (id) {
      if (!elementsById.has(id)) {
        elementsById.set(id, element);
      }
      order.push(element);
    }
    return element;
  };

  const children = bodyNode?.childNodes ?? [];
  let significantRootCount = 0;
  for (const child of children) {
    const converted = convert(child, null);
    if (converted) {
      roots.push(converted);
      if (
        converted.type === "element" ||
        (converted.type === "text" && converted.value.trim() !== "")
      ) {
        significantRootCount++;
      }
    }
  }

  return { roots, elementsById, order, significantRootCount };
}

function cloneElement(
  node: ElementNode,
  parent: ElementNode | null = null,
): ElementNode {
  const clone: ElementNode = {
    type: "element",
    tagName: node.tagName,
    attrs: { ...node.attrs },
    children: [],
    parent,
  };
  clone.children = node.children.map((child) =>
    child.type === "text"
      ? { type: "text", value: child.value, parent: clone }
      : cloneElement(child, clone),
  );
  return clone;
}

function appendClass(node: ElementNode, className: string): void {
  const existing = node.attrs.class
    ? node.attrs.class.split(/\s+/).filter(Boolean)
    : [];
  if (!existing.includes(className)) {
    existing.unshift(className);
  }
  node.attrs.class = existing.join(" ");
}

function setAttribute(node: ElementNode, key: string, value: string): void {
  node.attrs[key] = value;
}

function removeAttribute(node: ElementNode, key: string): void {
  delete node.attrs[key];
}

function hasAttribute(node: ElementNode, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(node.attrs, key);
}

function getAttribute(node: ElementNode, key: string): string | undefined {
  return node.attrs[key];
}

function setChildren(node: ElementNode, children: Node[]): void {
  node.children = children;
  for (const child of children) {
    child.parent = node;
  }
}

function createTextNode(value: string, parent: ElementNode): TextNode {
  return { type: "text", value, parent };
}

function createSpanNode(
  className: string,
  value: string,
  parent: ElementNode,
): ElementNode {
  const span: ElementNode = {
    type: "element",
    tagName: "span",
    attrs: { class: className },
    children: [],
    parent,
  };
  span.children = [createTextNode(value, span)];
  return span;
}

function getNodeText(node: ElementNode): string {
  const parts: string[] = [];
  const walk = (current: Node) => {
    if (current.type === "text") {
      parts.push(current.value);
      return;
    }
    for (const child of current.children) {
      walk(child);
    }
  };
  walk(node);
  return parts.join("");
}

function applyWordDiff(beforeNode: ElementNode, afterNode: ElementNode): void {
  const beforeText = getNodeText(beforeNode);
  const afterText = getNodeText(afterNode);
  if (beforeText === afterText) return;

  const diff = diffWords(beforeText, afterText);
  const newChildren: Node[] = diff.map((part) => {
    if (part.added) {
      return createSpanNode("diff-added", part.value, afterNode);
    }
    if (part.removed) {
      return createSpanNode("diff-removed", part.value, afterNode);
    }
    return createTextNode(part.value, afterNode);
  });

  setChildren(afterNode, newChildren);
}

const INTERACTIVE_TAGS = new Set(["button", "input", "select", "textarea"]);

function setPointerNone(node: ElementNode): void {
  const pointerRule = "pointer-events: none";
  const style = node.attrs.style ?? "";
  if (!style.includes(pointerRule)) {
    const newStyle =
      style.trim().length > 0 ? `${style}; ${pointerRule}` : pointerRule;
    setAttribute(node, "style", newStyle);
  }
}

function markElementNonInteractive(node: ElementNode): void {
  if (INTERACTIVE_TAGS.has(node.tagName)) {
    setAttribute(node, "disabled", "true");
    setPointerNone(node);
  }
  if (node.tagName === "a") {
    removeAttribute(node, "href");
    setPointerNone(node);
  }
  for (const child of node.children) {
    if (child.type === "element") {
      markElementNonInteractive(child);
    }
  }
}

function insertBefore(
  roots: Node[],
  parent: ElementNode | null,
  newNode: ElementNode,
  beforeNode: ElementNode | null,
): void {
  newNode.parent = parent;
  const list = parent ? parent.children : roots;
  if (beforeNode) {
    const index = list.indexOf(beforeNode);
    if (index >= 0) {
      list.splice(index, 0, newNode);
      return;
    }
  }
  list.push(newNode);
}

function renderNode(node: Node): string {
  if (node.type === "text") {
    return node.value ?? "";
  }
  const attrs = Object.entries(node.attrs)
    .map(([name, value]) => `${name}="${value.replace(/"/g, "&quot;")}"`)
    .join(" ");
  const inner = node.children.map(renderNode).join("");
  return `<${node.tagName}${attrs ? " " + attrs : ""}>${inner}</${node.tagName}>`;
}

function renderNodes(nodes: Node[]): string {
  return nodes.map(renderNode).join("");
}

function shallowAttributesEqual(
  beforeNode: ElementNode,
  afterNode: ElementNode,
): boolean {
  const beforeKeys = Object.keys(beforeNode.attrs).sort();
  const afterKeys = Object.keys(afterNode.attrs).sort();
  if (beforeKeys.length !== afterKeys.length) return false;
  for (let i = 0; i < beforeKeys.length; i++) {
    const key = beforeKeys[i]!;
    if (key !== afterKeys[i]) return false;
    if (beforeNode.attrs[key] !== afterNode.attrs[key]) return false;
  }
  return true;
}

function hasShallowDifference(
  beforeNode: ElementNode,
  afterNode: ElementNode,
): boolean {
  if (beforeNode.tagName !== afterNode.tagName) return true;
  if (!shallowAttributesEqual(beforeNode, afterNode)) return true;

  const beforeTexts = beforeNode.children.filter(
    (child) => child.type === "text",
  );
  const afterTexts = afterNode.children.filter(
    (child) => child.type === "text",
  );
  const filteredBefore = beforeTexts.filter(
    (child) => child.value.trim() !== "",
  );
  const filteredAfter = afterTexts.filter((child) => child.value.trim() !== "");
  if (filteredBefore.length !== filteredAfter.length) return true;
  for (let i = 0; i < filteredBefore.length; i++) {
    const beforeText = filteredBefore[i]!;
    const afterText = filteredAfter[i]!;
    if (beforeText.value !== afterText.value) return true;
  }
  return false;
}

function renderHtmlDiffInternal(args: {
  beforeHtml: string;
  afterHtml: string;
  diffAttribute?: string;
}): string {
  const diffAttr = args.diffAttribute ?? "data-diff-key";
  const before = buildTree(args.beforeHtml, diffAttr);
  const after = buildTree(args.afterHtml, diffAttr);

  const addedIds = new Set<string>();
  const modifiedIds = new Set<string>();
  for (const id of after.elementsById.keys()) {
    if (!before.elementsById.has(id)) {
      addedIds.add(id);
    } else {
      modifiedIds.add(id);
    }
  }

  const removedIds = new Set<string>();
  for (const id of before.elementsById.keys()) {
    if (!after.elementsById.has(id)) {
      removedIds.add(id);
    }
  }

  // Handle additions
  for (const id of addedIds) {
    const node = after.elementsById.get(id);
    if (!node) continue;
    appendClass(node, "diff-added");
  }

  // Handle modifications
  for (const id of modifiedIds) {
    const beforeNode = before.elementsById.get(id);
    const afterNode = after.elementsById.get(id);
    if (!beforeNode || !afterNode) continue;

    const mode =
      getAttribute(afterNode, "data-diff-mode") ??
      getAttribute(beforeNode, "data-diff-mode");

    if (mode === "element") {
      const clone = cloneElement(beforeNode);
      appendClass(clone, "diff-removed");
      setAttribute(clone, "contenteditable", "false");
      markElementNonInteractive(clone);

      appendClass(afterNode, "diff-added");
      const parent = afterNode.parent;
      insertBefore(after.roots, parent, clone, afterNode);
    } else if (mode === "words") {
      applyWordDiff(beforeNode, afterNode);
    } else if (hasShallowDifference(beforeNode, afterNode)) {
      appendClass(afterNode, "diff-modified");
    }
  }

  // Handle removals
  for (const beforeNode of before.order) {
    const id = getAttribute(beforeNode, diffAttr);
    if (!id || !removedIds.has(id)) continue;
    if (!hasAttribute(beforeNode, "data-diff-show-when-removed")) {
      continue;
    }

    const parentBefore = beforeNode.parent;
    const parentId = parentBefore
      ? getAttribute(parentBefore, diffAttr)
      : undefined;
    if (parentId && removedIds.has(parentId)) {
      continue;
    }

    let parentAfter: ElementNode | null = null;
    if (parentId) {
      parentAfter = after.elementsById.get(parentId) ?? null;
      if (!parentAfter) continue;
    }

    const siblingsBefore = parentBefore ? parentBefore.children : before.roots;
    let insertBeforeNode: ElementNode | null = null;
    let passedSelf = false;
    for (const sibling of siblingsBefore) {
      if (sibling === beforeNode) {
        passedSelf = true;
        continue;
      }
      if (!passedSelf) continue;
      if (sibling.type !== "element") continue;
      const siblingId = getAttribute(sibling, diffAttr);
      if (siblingId && !removedIds.has(siblingId)) {
        const afterSibling = after.elementsById.get(siblingId);
        if (afterSibling) {
          insertBeforeNode = afterSibling;
          break;
        }
      }
    }

    const clone = cloneElement(beforeNode);
    appendClass(clone, "diff-removed");
    setAttribute(clone, "contenteditable", "false");
    markElementNonInteractive(clone);

    insertBefore(after.roots, parentAfter, clone, insertBeforeNode);
  }

  const htmlContent = renderNodes(after.roots);
  if (after.roots.length === 1 && after.significantRootCount === 1) {
    return htmlContent;
  }
  return `<div>${htmlContent}</div>`;
}

export function renderHtmlDiff(args: {
  beforeHtml: string;
  afterHtml: string;
  diffAttribute?: string;
}): string {
  return renderHtmlDiffInternal(args);
}
