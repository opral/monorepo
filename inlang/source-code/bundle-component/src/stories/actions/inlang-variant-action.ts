import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../styling/base.js"

import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)

@customElement("inlang-variant-action")
export default class InlangVariantAction extends LitElement {
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

	@property()
	tooltip: string | undefined

	override render() {
		return html`<sl-tooltip content=${this.tooltip}
			><sl-button size="small">${this.actionTitle}</sl-button></sl-tooltip
		>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-variant-action": InlangVariantAction
	}
}
