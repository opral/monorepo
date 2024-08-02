import { LitElement, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import "./../pattern-editor/inlang-pattern-editor.js"
import type { Pattern } from "@inlang/sdk2"

@customElement("inlang-reactive-pattern-editor-wrapper")
export default class InlangReactivePatternEditorWrapper extends LitElement {
	@state()
	_pattern: Pattern = [
		{
			type: "text",
			value: "0",
		},
	]

	//disable shadow root -> because of contenteditable selection API
	override createRenderRoot() {
		return this
	}

	override async firstUpdated() {
		setInterval(() => {
			this._pattern = [
				{
					type: "text",
					value: Number(Math.random() * 100).toFixed(0),
				},
			]
		}, 4000)
	}

	override render() {
		console.log("render-wrapper", this._pattern)
		return html`<inlang-pattern-editor
			.pattern=${this._pattern}
			@change-pattern=${(pattern: any) => console.log("update", pattern.detail.argument)}
		></inlang-pattern-editor>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-reactive-pattern-editor-wrapper": InlangReactivePatternEditorWrapper
	}
}
