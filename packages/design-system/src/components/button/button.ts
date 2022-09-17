import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("in-button")
export class Button extends LitElement {
	@property()
	disabled? = false;

	@property()
	variant = "primary";

	render() {
		return html`
			<link rel="stylesheet" href="/tailwind.css"></link>
			<button class="px-5 py-2.5 bg-primary text-on-primary">
				<slot></slot>
			</button>
		`;
	}
}

// px-5 py-2.5 mr-2 mb-2
// 				text-on-${this.variant}
// 				bg-${this.variant}
// 				body-md
// 				rounded
