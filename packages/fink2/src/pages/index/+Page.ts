import { css, html } from "lit"
import "../../layout.js"
import { BaseElement } from "../../baseElement.js"
import type { PageContext } from "vike/types"
import { property, state } from "lit/decorators.js"
import { consume } from "@lit/context"
import { stateContext } from "../../state.js"
import { navigate } from "vike/client/router"

export const PageElementTag = "fink-index-page"

export class Page extends BaseElement {
	styles = css`
		.text-red-500 {
			color: red;
		}
	`

	@property()
	pageContext!: PageContext

	@consume({ context: stateContext, subscribe: true })
	count = 0

	render() {
		return html`
			<p>Welcome to subpage!</p>
			<button
				@click=${() => {
					this.count++
					console.log("count", this.count)
				}}
			>
				Increase Count: ${this.count}
			</button>
			<p>Current site is ${this.pageContext}</p>
			<a
				@click=${() => {
					navigate("/subpage")
				}}
			>
				Navigate to sub-page</a
			>
			<p class="text-red-500">testing tailwind</p>
		`
	}
}
