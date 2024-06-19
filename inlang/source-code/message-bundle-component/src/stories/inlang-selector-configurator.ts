import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlTag from "@shoelace-style/shoelace/dist/components/tag/tag.component.js"
import { createMessage, createVariant, type LanguageTag, type Message } from "@inlang/sdk/v2"
import { addSelector } from "../helper/crud/selector/add.js"
import upsertVariant from "../helper/crud/variant/upsert.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption)
if (!customElements.get("sl-tag")) customElements.define("sl-tag", SlTag)

@customElement("inlang-selector-configurator")
export default class InlangSelectorConfigurator extends LitElement {
	static override styles = [
		css`
			.button-wrapper {
				height: 44px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.dropdown-container {
				font-size: 13px;
				width: 300px;
				background-color: white;
				border: 1px solid var(--sl-color-neutral-300);
				padding: 16px;
				border-radius: 6px;
				display: flex;
				flex-direction: column;
				gap: 16px;
			}
			sl-select::part(form-control-label) {
				font-size: 13px;
				color: var(--sl-color-neutral-700);
			}
			.dropdown-title {
				font-size: 14px;
				font-weight: 600;
				margin: 0;
			}
			.options-container {
			}
			.options-title {
				font-size: 13px;
				color: var(--sl-color-neutral-700);
				margin: 0;
				padding-bottom: 4px;
			}
			.options-wrapper {
				display: flex;
				gap: 4px;
				flex-wrap: wrap;
			}
			.actions {
				width: 100%;
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
		`,
	]

	@property()
	inputs: string[] | undefined

	@property()
	message?: Message | undefined

	@property()
	languageTag: LanguageTag | undefined

	@property()
	triggerMessageBundleRefresh: () => void = () => {}

	@property()
	addMessage: (newMessage: Message) => void = () => {}

	@state()
	private _input: string | undefined

	private _getPluralCategories = (): string[] | undefined => {
		return this.languageTag
			? new Intl.PluralRules(this.languageTag).resolvedOptions().pluralCategories
			: undefined
	}

	private _handleAddSelector = (addVariants: boolean) => {
		if (this._input) {
			if (!this.message && this.languageTag) {
				// create selector in not present message
				const newMessage = createMessage({ locale: this.languageTag, text: "" })

				// add selector
				addSelector({
					message: newMessage,
					selector: {
						type: "expression",
						arg: {
							type: "variable",
							name: this._input,
						},
						annotation: {
							type: "function",
							name: "plural",
							options: [],
						},
					},
				})

				if (addVariants) {
					this._addVariants({ message: newMessage, variantMatcherArrays: [] })
				}

				this.addMessage(newMessage)
			} else if (this.message) {
				// get variant matchers arrays
				const _variants = structuredClone(this.message ? this.message.variants : [])
				const _variantMatcherArrays = _variants.map((variant) => variant.match)

				// add selector
				addSelector({
					message: this.message,
					selector: {
						type: "expression",
						arg: {
							type: "variable",
							name: this._input,
						},
						annotation: {
							type: "function",
							name: "plural",
							options: [],
						},
					},
				})

				// add plural options if present
				// TODO: for now always present
				if (addVariants) {
					this._addVariants({ message: this.message, variantMatcherArrays: _variantMatcherArrays })
				}
			}

			this.triggerMessageBundleRefresh()
		}
	}

	private _addVariants = (props: { message: Message; variantMatcherArrays: string[][] }) => {
		const _categories = this._getPluralCategories()

		if (_categories) {
			if (props.variantMatcherArrays && props.variantMatcherArrays.length > 0) {
				for (const variantMatcherArray of props.variantMatcherArrays) {
					for (const category of _categories) {
						upsertVariant({
							message: props.message,
							variant: createVariant({
								// combine the matches that are already present with the new category -> like a matrix
								match: [...variantMatcherArray, category],
							}),
						})
					}
				}
			} else {
				for (const category of _categories) {
					upsertVariant({
						message: props.message,
						variant: createVariant({
							// combine the matches that are already present with the new category -> like a matrix
							match: [category],
						}),
					})
				}
			}
		}
	}

	override async firstUpdated() {
		await this.updateComplete
		this._input = this.inputs && this.inputs[0]
	}

	override render() {
		return html`
			<sl-dropdown distance="-4">
				<div slot="trigger" class="button-wrapper">
					<slot></slot>
				</div>
				<div class="dropdown-container">
					<sl-select
						@sl-change=${(e: CustomEvent) => {
							const inputElement = e.target as HTMLInputElement
							this._input = inputElement.value
						}}
						@sl-show=${(e: CustomEvent) => {
							const inputElement = e.target as HTMLInputElement
							this._input = inputElement.value
						}}
						label="Input"
						size="small"
						value=${this.inputs && this.inputs[0]}
					>
						${this.inputs &&
						this.inputs.map((inputs) => {
							return html`<sl-option value=${inputs}>${inputs}</sl-option>`
						})}
					</sl-select>
					<sl-select label="Function" size="small" value="plural">
						<sl-option value="plural">plural</sl-option>
					</sl-select>
					<div class="options-container">
						<p class="options-title">Plural Categories</p>
						<div class="options-wrapper">
							${this._getPluralCategories()?.map((category) => {
								return html`<sl-tag size="small" type="info">${category}</sl-tag>`
							})}
						</div>
					</div>
					<div class="actions">
						<sl-button
							@click=${() => {
								this._handleAddSelector(false)
							}}
							size="small"
							variant="primary"
							>Add selector</sl-button
						>
						<sl-button
							@click=${() => {
								this._handleAddSelector(true)
							}}
							size="small"
							>Add selector with default variants</sl-button
						>
					</div>
				</div>
			</sl-dropdown>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-selector-configurator": InlangSelectorConfigurator
	}
}
