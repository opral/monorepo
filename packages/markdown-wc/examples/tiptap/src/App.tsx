import React, { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { markdownWcExtensions, astToTiptapDoc, tiptapDocToAst } from "@opral/markdown-wc/tiptap"
import { parseMarkdown, serializeAst } from "@opral/markdown-wc"

const initialMarkdown = `# Heading

Hello **world** and _friends_. Visit [OpenAI](https://openai.com "OpenAI").

- [x] task done
- [ ] task todo

| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |

\`\`\`js
const a = 1
\`\`\``

export default function App() {
	const [markdown, setMarkdown] = useState(initialMarkdown)
	const sync = useRef<{ fromMarkdown: boolean; lastEditorMd: string | null }>({
		fromMarkdown: false,
		lastEditorMd: null,
	})

  const editor = useEditor({
		extensions: markdownWcExtensions(),
		content: astToTiptapDoc(parseMarkdown(initialMarkdown)) as any,
		onUpdate: ({ editor }) => {
			if (sync.current.fromMarkdown) return
			const ast = tiptapDocToAst(editor.getJSON() as any) as any
			const md = serializeAst(ast)
			sync.current.lastEditorMd = md
			setMarkdown(md)
		},
  })

		// Checkbox toggling is now handled by a NodeView in markdownWcExtensions.

	// Markdown (left) → TipTap (right), without losing selection or causing loops
	useEffect(() => {
		if (!editor) return
		// If this markdown originated from the editor, skip resetting
		if (sync.current.lastEditorMd === markdown) {
			sync.current.lastEditorMd = null
			return
		}
		sync.current.fromMarkdown = true
		try {
			const nextDoc = astToTiptapDoc(parseMarkdown(markdown)) as any
			const current = editor.getJSON() as any
			if (JSON.stringify(current) !== JSON.stringify(nextDoc)) {
				const { from, to } = editor.state.selection
				;(editor.commands as any).setContent(nextDoc, false)
				const size = editor.state.doc.content.size
				editor.commands.setTextSelection({ from: Math.min(from, size), to: Math.min(to, size) })
			}
		} finally {
			sync.current.fromMarkdown = false
		}
	}, [markdown, editor])

	return (
		<div className="app">
			<div className="pane">
				<header>Markdown</header>
				<div className="content">
					<textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} />
				</div>
			</div>
			<div className="pane">
				<header>TipTap Editor</header>
				<div className="content editor">
					{editor ? (
            <>
              <div className="toolbar">
                <button
                  className={editor.isActive("bold") ? "active" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleMark("bold").run()
                  }}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  className={editor.isActive("italic") ? "active" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleMark("italic").run()
                  }}
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className={editor.isActive("strike") ? "active" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleMark("strike").run()
                  }}
                  title="Strikethrough"
                >
                  <span style={{ textDecoration: "line-through" }}>S</span>
                </button>
                <button
                  className={editor.isActive("link") ? "active" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (editor.isActive("link")) {
                      editor.chain().focus().unsetMark("link").run()
                      return
                    }
                    const href = window.prompt("Link URL", "https://")?.trim()
                    if (!href) return
                    const title = window.prompt("Link title (optional)")?.trim() || null
                    editor.chain().focus().setMark("link", { href, title }).run()
                  }}
                  title="Link"
                >
                  Link
                </button>
              </div>
              <EditorContent editor={editor} />
            </>
          ) : (
            "Loading…"
          )}
				</div>
			</div>
		</div>
	)
}
