import { html } from "lit";
import { classMap } from "lit-html/directives/class-map.js";
import { customElement, property } from "lit/decorators.js";
import { LightDomElement } from "../lightDomElement.js";

@customElement("in-button")
export class Button extends LightDomElement {
	@property()
	disabled? = false;

	@property()
	variant = "primary";

	render() {
		return html`
			<button class="px-5 py-2.5 bg-primary text-on-primary">
				${this.children}
			</button>
		`;
	}
}

// px-5 py-2.5 mr-2 mb-2
// 				text-on-${this.variant}
// 				bg-${this.variant}
// 				body-md
// 				rounded
