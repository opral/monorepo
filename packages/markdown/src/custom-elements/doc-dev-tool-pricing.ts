import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("doc-dev-tool-pricing")
export class DocDevToolPricing extends LitElement {
	static override styles = css`
		.doc-dev-tool {
			background-color: #ffffff;
			padding: 1rem 2rem;
			border-radius: 1rem;
			border: 1px solid #e2e8f0;
		}
		.doc-h2 {
		}
		.doc-p {
			color: #475569;
			line-height: 1.6rem;
		}
	`

	override render() {
		return html`<div class="doc-dev-tool">
			<h2 class="doc-h2">Our developer tools and libraries are free.</h2>
			<p class="doc-p">
				We will charge for products and services targeting large companies, not dev tools. We see
				dev tools as a necessity to solve the business problem of expanding internationally and good
				marketing for us. Developers who love our dev tools will recommend the inlang ecosystem to
				their employers/companies.
			</p>
		</div> `
	}
}
