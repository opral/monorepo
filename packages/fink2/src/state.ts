import { createContext, provide } from "@lit/context"
import { LitElement, html } from "lit"
import { customElement, state } from "lit/decorators.js"

export const stateContext = createContext<number>("state")

@customElement("app-state")
export class AppRoot extends LitElement {
	@provide({ context: stateContext })
	@state()
	count = 0

	render() {
		console.log("rendering app-state")
		return html`
			<p>Count: ${this.count}</p>
			<button @click=${() => this.count++}>Increment</button>
			<a href="/subpage">route to subpage</a>
			<slot> </slot>
		`
	}
}
