import { css, html, LitElement } from "lit"
import { customElement } from "lit/decorators.js"

// takes the inner elements and just renders them with custom styles around them
@customElement("doc-links")
export default class extends LitElement {
	static override styles = css`
		.doc-link-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			grid-gap: 1rem;
		}
	`

	override render() {
		return html`<div class="doc-link-grid">
			<slot></slot>
		</div>`
	}
}
