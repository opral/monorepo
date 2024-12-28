import { LitElement, css, html } from "lit"
import { property } from "lit/decorators.js"

export default class extends LitElement {
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

		.accordion-title.opened > doc-icon {
			transform: rotate(-180deg);
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

	@property({ type: Boolean, reflect: true })
	isOpen: boolean = false

	@property()
	heading: string = ""
	@property()
	text: string = ""

	override render() {
		return html`<div class="accordion-wrapper">
			<label
				for="accordion"
				class="accordion-title ${this.isOpen ? "opened" : ""}"
				@click=${this._handleClick}
				>${this.heading}
				<doc-icon icon="mdi:chevron-down" size="1.2em"></doc-icon>
			</label>
			<div class="accordion-content ${this.isOpen ? "show" : ""}">
				<p>${this.text}</p>
			</div>
		</div>`
	}

	_handleClick() {
		this.isOpen = !this.isOpen
	}
}
