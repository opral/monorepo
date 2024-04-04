import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"

@customElement("string-input")
export class StringInput extends LitElement {
	static override styles = [
		//baseStyling,
		css`
			.help-text {
				font-size: 0.8rem;
				color: var(--sl-input-help-text-color);
				margin: 0;
			}
			.description-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
				margin-bottom: 1rem;
				margin-top: 0.8rem;
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	value: string = ""

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (value: string, key: string, moduleId?: string) => void = () => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _examples(): string | undefined {
		return this.schema.examples ? "Example: " + JSON.stringify(this.schema.examples) : undefined
	}

	override render() {
		return html` <div part="property">
			<h3 part="property-title">${this.property}</h3>
			<div class="description-container">
				${this._description &&
				html`<p part="property-paragraph" class="help-text">${this._description}</p>`}
				${this._examples &&
				html`<p part="property-paragraph" class="help-text">${this._examples}</p>`}
			</div>
			<sl-input
				value=${this.value}
				size="small"
				@input=${(e: Event) => {
					this.handleInlangProjectChange(
						(e.target as HTMLInputElement).value,
						this.property,
						this.moduleId
					)
				}}
			>
			</sl-input>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"string-input": StringInput
	}
}
