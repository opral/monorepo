// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import { Editor } from "@tiptap/core"
import { MarkdownWc } from "./markdown-wc.js"

function createEditor() {
	return new Editor({
		extensions: MarkdownWc(),
	})
}

// Simulate real text input so input rules trigger
function typeText(editor: Editor, text: string) {
	for (const ch of text) {
		const { from, to } = editor.state.selection
		let handled = false
		editor.view.someProp("handleTextInput", (f: any) => {
			handled = f(editor.view, from, to, ch) || handled
		})
		if (!handled) {
			// Fallback: insert as plain content if no handler consumed it
			editor.commands.insertContent(ch)
		}
	}
}

function sendModKey(editor: Editor, key: string, opts?: { shift?: boolean }) {
	const tryPress = (flags: { metaKey: boolean; ctrlKey: boolean; shiftKey?: boolean }) => {
		const event = new KeyboardEvent("keydown", {
			key,
			metaKey: flags.metaKey,
			ctrlKey: flags.ctrlKey,
			shiftKey: !!flags.shiftKey,
			bubbles: true,
			cancelable: true,
		})
		let handled = false
		editor.view.someProp("handleKeyDown", (f: any) => {
			handled = f(editor.view, event) || handled
		})
		return handled
	}
	// Try meta-only first (mac style), then ctrl-only (windows/linux)
	if (tryPress({ metaKey: true, ctrlKey: false, shiftKey: opts?.shift })) return
	tryPress({ metaKey: false, ctrlKey: true, shiftKey: opts?.shift })
}

function sendKey(editor: Editor, key: string, opts?: { shift?: boolean }) {
  const event = new KeyboardEvent("keydown", {
    key,
    shiftKey: !!opts?.shift,
    bubbles: true,
    cancelable: true,
  })
  editor.view.someProp("handleKeyDown", (f: any) => f(editor.view, event))
}

describe("Markdown typing shortcuts (input rules)", () => {
	test.each([
		["#", 1],
		["##", 2],
		["###", 3],
		["####", 4],
		["#####", 5],
		["######", 6],
	])("%s ␣ → heading level %s", (hashes, level) => {
		const editor = createEditor()
		typeText(editor, `${hashes} `)
		const node = editor.state.doc.child(0)
		expect(node.type.name).toBe("heading")
		expect((node as any).attrs.level).toBe(level)
	})

	test("- ␣ → bullet list", () => {
		const editor = createEditor()
		typeText(editor, "- ")
		const list = editor.state.doc.child(0)
		expect(list.type.name).toBe("bulletList")
		expect(list.childCount).toBeGreaterThan(0)
		expect(list.child(0).type.name).toBe("listItem")
	})

	test("3. ␣ → ordered list start=3", () => {
		const editor = createEditor()
		typeText(editor, "3. ")
		const list = editor.state.doc.child(0)
		expect(list.type.name).toBe("orderedList")
		expect((list as any).attrs.start).toBe(3)
	})

	test("> ␣ → blockquote", () => {
		const editor = createEditor()
		typeText(editor, "> ")
		const node = editor.state.doc.child(0)
		expect(node.type.name).toBe("blockquote")
	})

	test.each([
		["[] ", false],
		["[ ] ", false],
		["[x] ", true],
	])("%s → task list item (checked=%s)", (trigger, checked) => {
		const editor = createEditor()
		// Support creating task from a plain paragraph
		typeText(editor, trigger as string)
		const list = editor.state.doc.child(0) as any
		expect(list.type.name).toBe("bulletList")
		const li = list.child(0) as any
		expect(li.type.name).toBe("listItem")
		expect(!!li.attrs?.checked).toBe(checked)
		// Should not retain trigger text
		const para = li.child(0) as any
		expect((para.textContent || "").trim()).toBe("")
	})
})

describe("Keyboard shortcuts (keymap)", () => {
	test("Mod-b toggles bold on selection", () => {
		const editor = createEditor()
		editor.commands.insertContent("abc")
		editor.commands.setTextSelection({ from: 1, to: 4 })
		sendModKey(editor, "b")
		expect(editor.isActive("bold")).toBe(true)
	})

	test("Mod-i toggles italic on selection", () => {
		const editor = createEditor()
		editor.commands.insertContent("abc")
		editor.commands.setTextSelection({ from: 1, to: 4 })
		sendModKey(editor, "i")
		expect(editor.isActive("italic")).toBe(true)
	})

  test("Shift-Mod-s toggles strike on selection", () => {
		const editor = createEditor()
		editor.commands.insertContent("abc")
		editor.commands.setTextSelection({ from: 1, to: 4 })
		sendModKey(editor, "s", { shift: true })
		expect(editor.isActive("strike")).toBe(true)
  })

  test("Enter in bullet list creates another bullet item", () => {
    const editor = createEditor()
    typeText(editor, "- ")
    typeText(editor, "abc")
    sendKey(editor, "Enter")
    const list: any = editor.state.doc.child(0)
    expect(list.type.name).toBe("bulletList")
    expect(list.childCount).toBe(2)
    const li2: any = list.child(1)
    expect(li2.type.name).toBe("listItem")
    const para2: any = li2.child(0)
    expect((para2.textContent || "").trim()).toBe("")
  })

  test("Enter in ordered list creates another numbered item", () => {
    const editor = createEditor()
    typeText(editor, "1. ")
    typeText(editor, "abc")
    sendKey(editor, "Enter")
    const list: any = editor.state.doc.child(0)
    expect(list.type.name).toBe("orderedList")
    expect(list.childCount).toBe(2)
  })

  test("Enter in todo list creates another unchecked todo", () => {
    const editor = createEditor()
    typeText(editor, "[] ")
    typeText(editor, "abc")
    sendKey(editor, "Enter")
    const list: any = editor.state.doc.child(0)
    expect(list.type.name).toBe("bulletList")
    expect(list.childCount).toBe(2)
    const li2: any = list.child(1)
    expect(li2.type.name).toBe("listItem")
    expect(li2.attrs?.checked).toBe(false)
  })

  test("Enter on empty bullet list item exits the list", () => {
    const editor = createEditor()
    typeText(editor, "- ")
    typeText(editor, "abc")
    sendKey(editor, "Enter") // create empty next item
    let list: any = editor.state.doc.child(0)
    expect(list.type.name).toBe("bulletList")
    expect(list.childCount).toBe(2)
    // Now press Enter on empty item to exit
    sendKey(editor, "Enter")
    // Expect bullet list + following paragraph
    const root: any = editor.state.doc
    expect(root.childCount).toBe(2)
    expect(root.child(0).type.name).toBe("bulletList")
    expect(root.child(1).type.name).toBe("paragraph")
  })

  test("Enter on empty ordered list item exits the list", () => {
    const editor = createEditor()
    typeText(editor, "1. ")
    typeText(editor, "abc")
    sendKey(editor, "Enter") // create empty next item
    let list: any = editor.state.doc.child(0)
    expect(list.type.name).toBe("orderedList")
    // Now press Enter on empty item to exit
    sendKey(editor, "Enter")
    const root: any = editor.state.doc
    expect(root.child(0).type.name).toBe("orderedList")
    expect(root.child(1).type.name).toBe("paragraph")
  })

  test("Enter on empty todo item exits the list", () => {
    const editor = createEditor()
    typeText(editor, "[] ")
    typeText(editor, "abc")
    sendKey(editor, "Enter") // create empty next todo
    let list: any = editor.state.doc.child(0)
    expect(list.type.name).toBe("bulletList")
    // Now press Enter on empty todo to exit
    sendKey(editor, "Enter")
    const root: any = editor.state.doc
    expect(root.child(0).type.name).toBe("bulletList")
    expect(root.child(1).type.name).toBe("paragraph")
  })
})
