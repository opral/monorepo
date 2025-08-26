import { Node, Mark, type Extensions } from "@tiptap/core"

// Minimal schema-only nodes and marks for MarkdownWc
export function markdownWcNodes(): Extensions {
    return [
        // doc
        Node.create({ name: "doc", topNode: true, content: "block+" }),
        // text
        Node.create({ name: "text", group: "inline" }),
        // paragraph
        Node.create({
            name: "paragraph",
            group: "block",
            content: "inline*",
            renderHTML() {
                return ["p", 0]
            },
        }),
        // heading
        Node.create({
            name: "heading",
            group: "block",
            content: "inline*",
            addAttributes() {
                return { level: { default: 1 } }
            },
            renderHTML({ node }) {
                const level = (node as any).attrs?.level || 1
                return ["h" + level, 0]
            },
        }),
        // lists
        Node.create({
            name: "bulletList",
            group: "block",
            content: "listItem+",
            renderHTML() {
                return ["ul", 0]
            },
        }),
        Node.create({
            name: "orderedList",
            group: "block",
            content: "listItem+",
            addAttributes() {
                return { start: { default: 1 } }
            },
            renderHTML({ node }) {
                const attrs: any = {}
                const start = (node as any).attrs?.start
                if (start && start !== 1) attrs.start = start
                return ["ol", attrs, 0]
            },
        }),
        Node.create({
            name: "listItem",
            group: "block",
            content: "paragraph block*",
            defining: true,
            renderHTML() {
                return ["li", 0]
            },
        }),
        // blockquote
        Node.create({
            name: "blockquote",
            group: "block",
            content: "block+",
            defining: true,
            renderHTML() {
                return ["blockquote", 0]
            },
        }),
        // code block
        Node.create({
            name: "codeBlock",
            group: "block",
            content: "text*",
            marks: "",
            defining: true,
            code: true,
            addAttributes() {
                return { language: { default: null } }
            },
            renderHTML() {
                return ["pre", ["code", 0]]
            },
        }),
        // horizontal rule
        Node.create({ name: "horizontalRule", group: "block", renderHTML() { return ["hr"] } }),
        // hard break
        Node.create({ name: "hardBreak", group: "inline", inline: true, selectable: false, renderHTML() { return ["br"] } }),
        // marks
        Mark.create({ name: "bold", renderHTML() { return ["strong", 0] } }),
        Mark.create({ name: "italic", renderHTML() { return ["em", 0] } }),
        Mark.create({ name: "strike", renderHTML() { return ["s", 0] } }),
        Mark.create({ name: "code", renderHTML() { return ["code", 0] } }),
    ]
}
