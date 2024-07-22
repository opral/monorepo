import { html } from "lit"
import { customElement } from "lit/decorators.js"
import { BaseElement } from "../base/base-element"

@customElement("home-page")
export class HomePage extends BaseElement {
	render() {
		return html`<div class="w-full w-full px-8 max-w-[650px] mx-auto">
			<h1 class="text-xl font-medium">Develop apps with built-in change control</h1>
			<p class="text-md">
				Your users get differentiating features: - I can build piplines! - I know whole changed
				this! - I can go back in history! - I can work together with hundreds of people!
			</p>
		</div>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"home-page": HomePage
	}
}
