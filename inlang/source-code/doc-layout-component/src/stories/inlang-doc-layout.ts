import { html, LitElement, css } from "lit"
import { customElement } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "./../helper/overridePrimitiveColors.js"

@customElement("inlang-doc-layout")
export default class InlangDocLayout extends LitElement {
	static override styles = [baseStyling, css``]

	override async firstUpdated() {
		await this.updateComplete

		//override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html` <div class="container" part="base">doc-layout-component</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-doc-layout": InlangDocLayout
	}
}
