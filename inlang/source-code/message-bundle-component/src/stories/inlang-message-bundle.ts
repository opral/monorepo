import { html, LitElement, css } from "lit"
import { customElement } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	static override styles = [baseStyling, css``]

	override async firstUpdated() {
		await this.updateComplete

		//override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html`<div class="container" part="base">Message Bundle</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-message-bundle": InlangMessageBundle
	}
}
