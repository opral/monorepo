import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "./../../field-header.js"

@customElement("language-tags-input")
export class LanguageTagsInput extends LitElement {
	static override styles = [
		css`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
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
			sl-tag::part(base) {
				background-color: var(--sl-input-filled-background-color-disabled);
				color: var(--sl-input-color);
				border-color: transparent;
				border-radius: var(--sl-input-border-radius-small);
			}
			sl-tag::part(remove-button) {
				color: var(--sl-input-placeholder-color);
			}
			sl-tag::part(remove-button):hover {
				color: var(--sl-input-color);
			}
			sl-button::part(base) {
				background-color: var(--sl-color-neutral-500);
				color: var(--sl-color-neutral-0);
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
	required?: boolean = false

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
			this._inputValue = "null"
			this._inputValue = undefined
		}
	}

	handleDeleteItemClick(index: number) {
		if (this.value) {
			this.value.splice(index, 1)
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
		}
	}

	override render() {
		return html`<div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.description=${this._description}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
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
					exportparts="base:button"
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
