import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import "./../../field-header.js"

@customElement("string-input")
export class StringInput extends LitElement {
	static override styles = [
		css`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			h3 {
				margin: 0;
				font-size: 14px;
				font-weight: 800;
			}
			.help-text {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
				margin: 0;
				line-height: 1.5;
			}
			.description-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
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
	required?: boolean = false

	@property()
	handleInlangProjectChange: (value: string, key: string, moduleId?: string) => void = () => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _examples(): string | undefined {
		return this.schema.examples
	}

	private get _title(): string | undefined {
		return this.schema.title || undefined
	}

	override render() {
		return html` <div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.description=${this._description}
				.examples=${this._examples}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
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
