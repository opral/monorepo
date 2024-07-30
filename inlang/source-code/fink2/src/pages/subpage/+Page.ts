import { html } from "lit"
import "../../layout.js"
import { BaseElement } from "../../baseElement.js"
import { consume } from "@lit/context"
import { property } from "lit/decorators.js"
import { stateContext } from "../../state.js"
import { navigate } from "vike/client/router"

export const PageElementTag = "fink-subpage-page"

export class Page extends BaseElement {
	@consume({ context: stateContext, subscribe: true })
	@property()
	count!: number

	render() {
		console.log("rendering subpage", this.count)
		return html`
			<p>Welcome to subpage!</p>
			<p>Count: ${this.count}</p>
			<button
				@click=${() => {
					navigate("/")
				}}
			>
				go back to previous page
			</button>
		`
	}
}
