import { html } from "lit"
import "../../layout.js"
import { property, state } from "lit/decorators.js"
import { BaseElement } from "../../baseElement.js"
import type { PageContext } from "vike/types"

export const PageElementTag = "fink-index-page"

export class Page extends BaseElement {
	@property()
	pageContext!: PageContext

	@state()
	count = 0

	render() {
		return html`
			<fink-layout>
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
				<a href="/subpage">Navigate to sub-page</a>
				<p class="text-red-500">testing tailwind</p>
			</fink-layout>
		`
	}
}
