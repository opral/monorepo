import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"

@customElement("language-tags-input")
export class LanguageTagsInput extends LitElement {
	static override styles = [
		//baseStyling,
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
				line-height: 1.5;
				margin: 0;
			}
			.tags-container {
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
			}
			.disabled-input::part(base) {
				cursor: unset;
				opacity: 1;
			}
			.disabled-input::part(suffix) {
				cursor: pointer;
				opacity: 0.5;
			}
			.disabled-input::part(suffix):hover {
				opacity: 1;
			}
			.add-input {
				flex-grow: 1;
			}
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.new-line-container {
				display: flex;
				gap: 4px;
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	value: Array<string> = []

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (value: Array<string>, key: string, moduleId?: string) => void =
		() => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _title(): string | undefined {
		return this.schema.title || undefined
	}

	@state()
	private _inputValue: string | undefined = undefined

	handleInputChange(e: Event) {
		const inputElement = e.target as HTMLInputElement
		this._inputValue = inputElement.value
	}

	handleAddItemClick() {
		if (this._inputValue && this._inputValue.trim() !== "") {
			this.value ? this.value.push(this._inputValue) : (this.value = [this._inputValue])
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = undefined
			this.requestUpdate()
		}
	}

	handleDeleteItemClick(index: number) {
		if (this.value) {
			this.value.splice(index, 1)
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = undefined
			this.requestUpdate()
		}
	}

	override render() {
		return html`<div part="property" class="property">
			<h3 part="property-title" class="property">${this._title ? this._title : this.property}</h3>
			${this._description &&
			html`<p part="property-paragraph" class="help-text">${this._description}</p>`}
			<div class="tags-container">
				${this.value &&
				this.value.map((arrayItem, index) => {
					return html`
						<sl-tag
							@sl-remove=${() => {
								this.handleDeleteItemClick(index)
							}}
							removable
							size="small"
							>${arrayItem}</sl-tag
						>
					`
				})}
			</div>
			<div class="new-line-container">
				<sl-input
					class="add-input"
					size="small"
					placeholder="Enter languageTag ..."
					@input=${(e: Event) => this.handleInputChange(e)}
					@keydown=${(e: KeyboardEvent) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputValue}
				>
				</sl-input>
				<sl-button
					size="small"
					variant="neutral"
					@click=${() => {
						this.handleAddItemClick()
					}}
				>
					Add
				</sl-button>
			</div>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"language-tags-input": LanguageTagsInput
	}
}
