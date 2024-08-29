import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../../styling/base.js"

import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)

@customElement("inlang-bundle-action")
export default class InlangBundleAction extends LitElement {
	static override styles = [
		baseStyling,
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
			}
			sl-button::part(base) {
				color: var(--sl-input-color);
				background-color: var(--sl-input-background-color);
				border: 1px solid var(--sl-input-border-color);
				border-radius: 4px;
				font-size: 13px;
			}
			sl-button::part(base):hover {
				color: var(--sl-input-color-hover);
				background-color: var(--sl-input-background-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
		`,
	]

	//props
	@property()
	actionTitle: string | undefined

	override render() {
		return html`<sl-menu-item>${this.actionTitle}</sl-menu-item>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-bundle-action": InlangBundleAction
	}
}
