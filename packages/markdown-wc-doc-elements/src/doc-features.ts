import { css, html, LitElement } from "lit"

export default class extends LitElement {
	static override styles = css`
		.doc-features-container {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
			flex-direction: row;
			width: 100%;
		}

		::slotted(doc-feature) {
			flex-grow: 2;
			min-width: 200px;
		}
	`

	override render() {
		return html`<div class="doc-features-container">
			<slot class="doc-feature-container"></slot>
		</div>`
	}
}
