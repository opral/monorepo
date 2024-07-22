import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"

import {
	type Declaration,
	createMessage,
	createVariant,
	type LanguageTag,
	type Message,
	type Variant,
} from "@inlang/sdk/v2"
import addSelector from "../helper/crud/selector/add.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import "./inlang-add-input.js"

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
				width: 240px;
				background-color: var(--sl-panel-background-color);
				border: 1px solid var(--sl-input-border-color);
				padding: 12px;
				border-radius: 6px;
				display: flex;
				flex-direction: column;
				gap: 16px;
			}
			.dropdown-item {
				display: flex;
				flex-direction: column;
				gap: 2px;
			}
			.dropdown-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				color: var(--sl-input-color);
				font-size: 12px;
			}
			.dropdown-title {
				font-size: 12px;
				font-weight: 500;
				margin: 6px 0;
			}
			.add-input::part(base) {
				color: var(--sl-color-neutral-500);
			}
			.add-input::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
			}
			sl-select::part(form-control-label) {
				font-size: 13px;
			}
			sl-select::part(display-input) {
				font-size: 13px;
			}
			sl-option::part(label) {
				font-size: 14px;
			}
			sl-menu-item::part(label) {
				font-size: 14px;
				padding-left: 12px;
			}
			sl-menu-item::part(base) {
				color: var(--sl-input-color);
			}
			sl-menu-item::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
			}
			sl-menu-item::part(checked-icon) {
				display: none;
			}
			.options-title {
				font-size: 14px;
				color: var(--sl-input-color);
				background-color: var(--sl-input-background-color);
				margin: 0;
				padding-bottom: 4px;
			}
			.options-wrapper {
				display: flex;
				gap: 4px;
				flex-wrap: wrap;
				margin-top: 4px;
			}
			.option {
				width: 100%;
			}
			.option::part(base) {
				background-color: var(--sl-input-background-color-hover);
				border-radius: var(--sl-input-border-radius-small);
			}
			.option {
				width: 100%;
				background-color: var(--sl-input-background-color-hover);
			}
			.delete-icon {
				color: var(--sl-color-neutral-400);
				cursor: pointer;
			}
			.delete-icon:hover {
				color: var(--sl-input-color-hover);
			}
			.help-text {
				display: flex;
				gap: 8px;
				color: var(--sl-input-help-text-color);
			}
			.help-text p {
				flex: 1;
				margin: 0;
				font-size: 12px;
				line-height: 1.5;
			}
			.empty-image {
				width: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				margin-top: 12px;
			}
			.actions {
				width: 100%;
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			sl-input::part(base) {
				font-size: 13px;
			}
		`,
	]

	@property()
	inputs: Declaration[] | undefined

	@property()
	message?: Message | undefined

	@property()
	locale: LanguageTag | undefined

	@property()
	triggerMessageBundleRefresh: () => void = () => {}

	@property()
	triggerSave: () => void = () => {}

	@property()
	addMessage: (newMessage: Message) => void = () => {}

	@property()
	addInput: (inputName: string) => void = () => {}

	@state()
	private _input: string | undefined

	@state()
	private _function: string | undefined

	@state()
	private _matchers: string[] | undefined

	@state()
	private _isNewInput: boolean = false

	@state()
	private _newInputSting: string | undefined

	// events
	dispatchOnInsertMessage(message: Message, variants: Variant[]) {
		const onInsertMessage = new CustomEvent("insert-message", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					message,
					variants,
				},
			},
		})
		this.dispatchEvent(onInsertMessage)
	}

	dispatchOnUpdateMessage(message: Message, variants: Variant[]) {
		const onUpdateMessage = new CustomEvent("update-message", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					message,
					variants,
				},
			},
		})
		this.dispatchEvent(onUpdateMessage)
	}

	dispatchOnInsertVariant(variant: Variant) {
		const onInsertVariant = new CustomEvent("insert-variant", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					variant,
				},
			},
		})
		this.dispatchEvent(onInsertVariant)
	}

	private _getPluralCategories = (): string[] | undefined => {
		return this.locale
			? [...new Intl.PluralRules(this.locale).resolvedOptions().pluralCategories, "*"]
			: undefined
	}

	private _handleAddSelector = (newMatchers: string[]) => {
		// get dropdown by "dropdown" class
		const dropdown = this.shadowRoot?.querySelector(".dropdown") as SlDropdown
		if (dropdown) dropdown.hide()

		if (this._isNewInput && this._newInputSting && this._newInputSting.length > 0) {
			this.addInput(this._newInputSting)
			this._input = this._newInputSting
		}

		if (this._input) {
			if (!this.message && this.locale) {
				// create selector in not present message
				const newMessage = createMessage({ locale: this.locale, text: "" })

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
							name: this._function || "plural",
							options: [],
						},
					},
				})

				this._addVariants({
					message: newMessage,
					variantMatcherArrays: [],
					newMatchers: newMatchers,
				})
				this.addMessage(newMessage)
				this.dispatchOnInsertMessage(newMessage, newMessage.variants)
				for (const variant of newMessage.variants) {
					this.dispatchOnInsertVariant(variant)
				}
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
							name: this._function || "plural",
							options: [],
						},
					},
				})

				const updatedVariant = structuredClone(this.message.variants)
				this.dispatchOnUpdateMessage(this.message, updatedVariant)

				this._addVariants({
					message: this.message,
					variantMatcherArrays: _variantMatcherArrays,
					newMatchers: newMatchers,
				})

				// only inserted variants should be dispatched -> show filter
				const insertedVariants = this.message.variants.filter(
					(variant) => !updatedVariant.find((v) => v.id === variant.id)
				)
				for (const variant of insertedVariants) {
					this.dispatchOnInsertVariant(variant)
				}
			}

			this.triggerSave()
			this.triggerMessageBundleRefresh()
		}
	}

	private _addVariants = (props: {
		message: Message
		variantMatcherArrays: string[][]
		newMatchers: string[]
	}) => {
		const newMatchers = props.newMatchers.filter((category) => category !== "*")
		if (newMatchers) {
			if (props.variantMatcherArrays && props.variantMatcherArrays.length > 0) {
				for (const variantMatcherArray of props.variantMatcherArrays) {
					for (const category of newMatchers) {
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
				for (const category of newMatchers) {
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

	private _resetConfiguration = () => {
		this._input = this.inputs && this.inputs[0] && this.inputs[0].name
		this._function = "plural"
		this._matchers = this._getPluralCategories() || ["*"]
	}

	override async firstUpdated() {
		await this.updateComplete
		this._input = this.inputs && this.inputs[0] && this.inputs[0].name
		this._function = "plural"
		this._matchers = this._getPluralCategories() || ["*"]
	}

	override render() {
		return html`
			<sl-dropdown
				distance="-4"
				class="dropdown"
				@sl-show=${(e: CustomEvent) => {
					const dropdown = this.shadowRoot?.querySelector("sl-dropdown")
					if (dropdown) {
						if (e.target === dropdown) {
							this._input =
								this.inputs && this.inputs.length > 0 && this.inputs[0]
									? this.inputs[0].name
									: undefined
							if (this.inputs && this.inputs.length === 0) {
								this._isNewInput = true
							}
						}
					}
				}}
			>
				<div slot="trigger" class="button-wrapper">
					<slot></slot>
				</div>
				<div class="dropdown-container">
					<div class="dropdown-item">
						<div class="dropdown-header">
							<p class="dropdown-title">Input</p>
							${this._isNewInput && this.inputs && this.inputs.length > 0
								? html`<sl-tooltip content="Show inputs">
										<sl-button
											class="add-input"
											variant="text"
											size="small"
											@click=${() => {
												this._isNewInput = false
												this.requestUpdate()
											}}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												slot="prefix"
												style="margin: 0 -2px"
											>
												<path
													fill="currentColor"
													fill-rule="evenodd"
													d="M3.25 7A.75.75 0 0 1 4 6.25h16a.75.75 0 0 1 0 1.5H4A.75.75 0 0 1 3.25 7m0 5a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75m0 5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75"
													clip-rule="evenodd"
												/>
											</svg>
										</sl-button>
								  </sl-tooltip>`
								: ``}
							${!this._isNewInput
								? html`<sl-tooltip content="Add a new input">
										<sl-button
											class="add-input"
											variant="text"
											size="small"
											@click=${() => {
												this._isNewInput = true
												this.requestUpdate()
											}}
											><svg
												viewBox="0 0 24 24"
												width="18"
												height="18"
												slot="prefix"
												style="margin: 0 -2px"
											>
												<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path></svg
										></sl-button>
								  </sl-tooltip>`
								: ``}
						</div>
						${!this._isNewInput
							? html`<sl-select
									@sl-change=${(e: CustomEvent) => {
										const inputElement = e.target as HTMLInputElement
										this._input = inputElement.value
									}}
									@sl-show=${(e: CustomEvent) => {
										const inputElement = e.target as HTMLInputElement
										this._input = inputElement.value
									}}
									size="small"
									value=${this._input || this.inputs?.[0]}
							  >
									${this.inputs &&
									this.inputs.map((input) => {
										return html`<sl-option value=${input.name}>${input.name}</sl-option>`
									})}
							  </sl-select>`
							: html`<sl-input 
										size="small" 
										placeholder="Enter input name ..." 
										@sl-input=${(e: CustomEvent) => {
											this._newInputSting = (e.target as HTMLInputElement).value
										}}
										</sl-input>`}
					</div>
					${this._isNewInput
						? html`<div class="help-text">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24px"
									height="24px"
									viewBox="0 0 256 256"
								>
									<path
										fill="currentColor"
										d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"
									/>
								</svg>
								<p>No input present. Add a new input to create a selector.</p>
						  </div>`
						: ``}
					<div class="dropdown-item">
						<div class="dropdown-header">
							<p class="dropdown-title">Function</p>
						</div>
						<sl-select
							size="small"
							value="plural"
							@sl-change=${(e: CustomEvent) => {
								const option = (e.target as HTMLSelectElement).value as string
								if (option === "string") {
									this._function = "string"
									this._matchers = ["*"]
									this.requestUpdate()
								} else if (option === "plural") {
									this._function = "plural"
									this._matchers = this._getPluralCategories() || ["*"]
									this.requestUpdate()
								}
							}}
						>
							<sl-option value="plural">plural</sl-option>
							<sl-option value="string">string</sl-option>
						</sl-select>
					</div>
					<div class="options-container">
						<div class="dropdown-header">
							<p class="dropdown-title">Match</p>
							<sl-tooltip content="Add a match to this selector">
								<sl-button
									class="add-input"
									variant="text"
									size="small"
									@click=${() => {
										this._matchers?.push("")
										this.requestUpdate()
										// get the last input element and focus it
										setTimeout(() => {
											const inputs = this.shadowRoot?.querySelectorAll(".option")
											const lastInput = inputs && (inputs[inputs.length - 1] as HTMLInputElement)
											lastInput?.focus(), 100
										})
									}}
									><svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										slot="prefix"
										style="margin: 0 -2px"
									>
										<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path></svg
								></sl-button>
							</sl-tooltip>
						</div>
						<div class="options-wrapper">
							${this._matchers?.map((category, index) => {
								return html`<sl-input
									class="option"
									size="small"
									value=${category}
									filled
									@input=${(e: Event) => {
										this._matchers = this._matchers || []
										this._matchers[index] = (e.target as HTMLInputElement).value
									}}
									><svg
										xmlns="http://www.w3.org/2000/svg"
										width="18px"
										height="18px"
										viewBox="0 0 24 24"
										slot="suffix"
										class="delete-icon"
										style="margin-left: -4px; margin-right: 8px"
										@click=${() => {
											//delete with splic
											this._matchers = this._matchers || []
											this._matchers.splice(index, 1)
											this.requestUpdate()
										}}
									>
										<path
											fill="currentColor"
											d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
										/></svg
								></sl-input>`
							})}
						</div>
					</div>
					<div class="help-text">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24px"
							height="24px"
							viewBox="0 0 256 256"
						>
							<path
								fill="currentColor"
								d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"
							/>
						</svg>
						<p>The selector automatically adds the variants from the list of matchers.</p>
					</div>
					<div class="actions">
						<sl-button
							@click=${() => {
								if (this._matchers) {
									this._handleAddSelector(this._matchers)
								} else {
									console.info("No matchers present")
								}
								this._resetConfiguration()
							}}
							size="small"
							variant="primary"
							>Add selector</sl-button
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
