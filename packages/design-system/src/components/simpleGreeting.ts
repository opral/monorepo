import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitElementWithTailwindCss } from "./utilities/LitElementWithTailwindCss.js";

@customElement("simple-greeting")
export class SimpleGreeting extends LitElementWithTailwindCss {
	@property()
	name = "Somebody";

	render() {
		return html`
			<div class="w-10 h-10 bg-primary"></div>
			<div class="w-10 h-10 bg-secondary"></div>
			<div class="w-10 h-10 bg-tertiary"></div>
		`;
	}
}
