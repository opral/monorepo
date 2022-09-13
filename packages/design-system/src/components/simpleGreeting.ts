import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitElementWithTailwindCss } from "./utilities/LitElementWithTailwindCss.js";

@customElement("simple-greeting")
export class SimpleGreeting extends LitElementWithTailwindCss {
	@property()
	name = "Somebody";

	render() {
		return html`
			<div class="bg-primary h-20 flex items-center justify-center">
				<div class="h-10 bg-on-primary bg-red-200">some text</div>
			</div>
		`;
	}
}
