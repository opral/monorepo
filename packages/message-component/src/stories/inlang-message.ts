import { html, LitElement, css } from "lit"
import { customElement } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "./../helper/overridePrimitiveColors.js"

@customElement("inlang-message")
export default class InlangMessage extends LitElement {
	static override styles = [baseStyling, css``]

	override async firstUpdated() {
		await this.updateComplete

		//override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html`<div class="container" part="base">Message</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-message": InlangMessage
	}
}
