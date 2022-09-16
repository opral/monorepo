import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitElementWithTailwindCss } from "../utilities/LitElementWithTailwindCss.js";

@customElement("in-button")
export class Button extends LitElementWithTailwindCss {
	@property()
	name = "Somebody";

	@property()
	age = 23;

	render() {
		return html`
			<div class="w-10 h-10 bg-primary"></div>
			<div class="w-10 h-10 bg-secondary"></div>
			<div class="w-10 h-10 bg-tertiary"></div>
			<p>My name is ${this.name}</p>
		`;
	}
}
