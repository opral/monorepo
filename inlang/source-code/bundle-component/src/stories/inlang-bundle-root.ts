import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"

@customElement("inlang-bundle-root")
export default class InlangBundleRoot extends LitElement {
	static override styles = [
		baseStyling,
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
			}
			.messages-container {
				width: 100%;
				margin-bottom: 16px;
			}
		`,
	]

	override render() {
		return html`<div>
			<slot name="bundle-header"></slot>
			<slot name="messages"></slot>
		</div>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-bundle-root": InlangBundleRoot
	}
}
