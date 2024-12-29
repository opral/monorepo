import { css, html, LitElement } from "lit"

export default class Element extends LitElement {
	static override styles = css`
		.doc-comment-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
		}
	`

	override render() {
		return html`<div class="doc-comment-grid">
			<slot></slot>
		</div>`
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-comments")) {
	customElements.define("doc-comments", Element)
}
