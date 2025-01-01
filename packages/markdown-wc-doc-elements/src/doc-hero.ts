import { LitElement, html, css } from "lit"

export default class Element extends LitElement {
	static override styles = css`
		.container {
			color: #000;
			margin: 24px 0;
			display: flex;
			flex-direction: column;
			gap: 24px;
		}
		p {
			margin: 0;
		}
		h1 {
			margin: 0;
			width: 80%;
			line-height: 2.5rem;
		}
		.tag {
			background-color: #fff;
			color: #475569;
			padding: 0 20px;
			height: 34px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 34px;
			width: fit-content;
			border: 1px solid #e2e8f0;
			font-size: 14px;
			font-weight: 500;
		}
		.description {
			color: #475569;
		}
		.companies-title {
			font-size: 14px;
			color: #475569;
			font-weight: 500;
		}
		ul {
			display: flex;
			flex-wrap: wrap;
			padding: 0;
			gap: 24px;
		}
		.company {
			height: 28px;
			opacity: 0.7;
		}
		.button-wrapper {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}
		.button {
			height: 40px;
			padding: 0 16px;
			border-radius: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			text-decoration: none;
			font-weight: 500;
			cursor: pointer;
		}
		.primary {
			background-color: #334154;
			color: #fff;
		}
		.primary:hover {
			background-color: #10172a;
		}
		.secondary {
			background-color: #e2e8f0;
			color: #000;
		}
		.secondary:hover {
			background-color: #cbd5e1;
		}
	`
	static override properties = {
		title: { type: String },
		description: { type: String },
		"primary-text": { type: String },
		"primary-link": { type: String },
		"secondary-text": { type: String },
		"secondary-link": { type: String },
		tag: { type: String },
		companies: { type: String },
	}

	override title: string = ""
	description: string = ""
	"primary-text": string = ""
	"primary-link": string = ""
	"secondary-text": string = ""
	"secondary-link": string = ""
	tag: string = ""
	companies: string = ""

	private get _parsedCompanies(): Array<string> | undefined {
		if (this.companies && this.companies !== "") {
			return JSON.parse(this.companies)
		} else {
			return undefined
		}
	}

	override render() {
		return html`<div class="container">
			<div class="tag">${this.tag}</div>
			<h1>${this.title}</h1>
			<p class="description">${this.description}</p>
			${this.companies && this.companies.length > 0
				? html`<div>
						<h2 class="companies-title">Used by:</h2>
						<ul>
							${this._parsedCompanies?.map(
								(company) => html`<img class="company" src=${company} alt=${company} />`
							)}
						</ul>
					</div>`
				: ``}
			<div class="button-wrapper">
				<a class="button primary" href=${this["primary-link"]}>${this["primary-text"]}</a>
				${this["secondary-link"] && this["secondary-text"]
					? html`<a class="button secondary" href=${this["secondary-link"]}
							>${this["secondary-text"]}</a
						>`
					: ""}
			</div>
		</div>`
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-hero")) {
	customElements.define("doc-hero", Element)
}