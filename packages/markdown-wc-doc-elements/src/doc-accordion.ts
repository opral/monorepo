import { LitElement, css, html } from "lit"

export default class Element extends LitElement {
	static override styles = css`
		.accordion-wrapper {
			margin: 0;
			margin-top: 1em;
			margin-bottom: 1em;
		}

		.accordion-title {
			display: flex;
			align-items: center;
			gap: 0.2rem;
			cursor: pointer;
			font-size: 1rem;
			transition: color 0.3s ease-out;
		}

		.accordion-title > doc-icon {
			margin-bottom: 0.2em;
			transition: transform 0.2s ease-out;
		}

		.accordion-title:hover {
			color: #000;
		}

		.accordion-title.opened {
			color: #0891b2;
		}

		.accordion-content {
			max-height: 0;
			overflow: hidden;
			transition: max-height 0.3s ease-out;
			margin-top: 0.5em;
			padding-left: 16px;
			padding-right: 16px;
			background-color: #e3e8ec;
			border-radius: 0.5rem;
		}

		.accordion-content.show {
			max-height: 200px;
			margin-bottom: 2rem;
		}
	`

	static override properties = {
		open: {},
		heading: { type: String },
		text: { type: String },
	}

	open: boolean | undefined
	heading!: string
	text!: string

	constructor() {
		super()
		this.open = false
	}

	override render() {
		return html`<div class="accordion-wrapper">
			<label
				for="accordion"
				class="accordion-title ${this.open ? "opened" : ""}"
				@click=${this._handleClick}
				>${this.heading}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
					<path fill="currentColor" d="m7 10l5 5l5-5z" />
				</svg>
			</label>
			<div class="accordion-content ${this.open ? "show" : ""}">
				<p>${this.text}</p>
			</div>
		</div>`
	}

	_handleClick() {
		this.open = !this.open
		// TODO automatic re-rendering is not working. manual re-rendering is needed
		this.requestUpdate()
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-accordion")) {
	customElements.define("doc-accordion", Element)
}
