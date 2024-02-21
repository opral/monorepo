import { html, LitElement } from "lit"
import { customElement } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"

@customElement("inl-settings")
export class InlSettings extends LitElement {
	static override styles = baseStyling

	override render() {
		return html` <div>Settings</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inl-settings": InlSettings
	}
}
