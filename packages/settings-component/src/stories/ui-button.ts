import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import "@shoelace-style/shoelace/dist/components/button/button.js"
import { baseStyling } from "../styling/base.js"

@customElement("ui-button")
export class UiButton extends LitElement {
	@property()
	size: "small" | "medium" | "large" = "small"

	@property()
	variant: "default" | "primary" | "success" | "neutral" | "warning" | "danger" | "text" = "default"

	@property()
	label: string = "Button"

	static override styles = baseStyling

	override render() {
		return html` <sl-button size=${this.size} variant=${this.variant}>${this.label}</sl-button> `
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"ui-button": UiButton
	}
}
