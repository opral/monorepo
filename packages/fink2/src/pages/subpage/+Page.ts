import { html } from "lit"
import "../../layout.js"
import { BaseElement } from "../../baseElement.js"

export const PageElementTag = "fink-subpage-page"

export class Page extends BaseElement {
	render() {
		return html`
			<fink-layout>
				<p>Welcome to subpage!</p>

				<button
					@click=${() => {
						history.back()
					}}
				>
					go back to previous page
				</button>
			</fink-layout>
		`
	}
}
