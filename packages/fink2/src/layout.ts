import { customElement, state } from "lit/decorators.js"
import { BaseElement } from "./baseElement.js"
import { html } from "lit"

@customElement("fink-layout")
export class Layout extends BaseElement {
	render() {
		return html`
			<div class="bg-red-200 p-6">
				<fink-counter></fink-counter>
				<hr />
				<slot> </slot>
			</div>
		`
	}
}

@customElement("fink-counter")
export class Counter extends BaseElement {
	@state()
	count = 0

	render() {
		return html`
			<p>Count: ${this.count}</p>
			<button @click=${() => this.count++}>Increment</button>
		`
	}
}
