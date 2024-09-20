import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { createChangeEvent } from "../../../helper/event.js"
import { baseStyling } from "../../../styling/base.js"
import {
	createVariant,
	type Message,
	type MessageNested,
	type Expression,
	Declaration,
} from "@inlang/sdk2"

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"

if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)

@customElement("inlang-add-selector")
export default class InlangAddSelector extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.button-wrapper {
				height: 44px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.dropdown-container {
				font-size: 14px;
				width: full;
				padding: 20px;
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
				font-size: 14px;
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
				font-size: 14px;
			}
			sl-select::part(display-input) {
				font-size: 14px;
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
				font-size: 14px;
			}
			.add-selector::part(base) {
				border-radius: 4px;
				cursor: pointer;
				font-size: 14px;
			}
			.add-selector::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
		`,
	]

	@property()
	message?: MessageNested | undefined

	@property()
	messages?: MessageNested | undefined

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

	private _getPluralCategories = (): string[] | undefined => {
		return this.message?.locale
			? [...new Intl.PluralRules(this.message.locale).resolvedOptions().pluralCategories, "*"]
			: undefined
	}

	private _getInputs = () => {
		const inputs: Declaration[] = []
		if (this.messages) {
			for (const message of this.messages as unknown as Message[]) {
				for (const declaration of message.declarations) {
					if (declaration.type === "input" && !inputs.some((d) => d.name === declaration.name)) {
						inputs.push(declaration)
					}
				}
			}
		}
		return inputs
	}

	private _handleAddSelector = (newMatchers: string[]) => {
		// close dropdown
		const dropdown = this.shadowRoot?.querySelector(".dropdown") as SlDropdown
		if (dropdown) dropdown.hide()

		// Step 0 | (optinal) adding input
		this._addInput()

		if (this._input && this.message) {
			// get variant matcher
			const message = structuredClone(this.message)
			const _variantsMatcher = (message ? message.variants : []).map((variant) => variant.match)

			// Step 1 | add selector to message
			this._updateSelector()

			// Step 2 | add "*" to existing variants
			this._addMatchToExistingVariants()

			// Step 3 | get newCombinations and add new variants
			const newCombinations = this._generateNewMatcherCombinations({
				variantsMatcher: _variantsMatcher,
				newMatchers: newMatchers,
				newSelectorName: this._input,
			})
			this._addVariantsFromNewCombinations(newCombinations)

			this.dispatchEvent(new CustomEvent("submit"))
		}
	}

	private _addInput = () => {
		if (this._isNewInput && this._newInputSting && this._newInputSting.length > 0) {
			for (const message of (this.messages as any as Message[]) || []) {
				const newMessage = structuredClone(message)

				newMessage.declarations.push({
					type: "input",
					name: this._newInputSting,
					// value: {
					// 	type: "expression",
					// 	arg: {
					// 		type: "variable",
					// 		name: this._newInputSting,
					// 	},
					// },
				})

				this.dispatchEvent(
					createChangeEvent({
						type: "Message",
						operation: "update",
						newData: newMessage,
					})
				)
			}
			this._input = this._newInputSting
		}
	}

	private _updateSelector = () => {
		if (this.message && this._input) {
			this.message.selectors.push({
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
			})
			this.dispatchEvent(
				createChangeEvent({
					type: "Message",
					operation: "update",
					newData: this.message,
				})
			)
		}
	}

	private _addMatchToExistingVariants = () => {
		if (this.message && this._input) {
			for (const variant of this.message.variants) {
				variant.match[this._input] = "*"

				this.dispatchEvent(
					createChangeEvent({
						type: "Variant",
						operation: "update",
						newData: variant,
					})
				)
			}
		}
	}

	private _addVariantsFromNewCombinations = (newCombinations: Array<Record<string, string>>) => {
		if (this.message) {
			for (const combination of newCombinations) {
				const newVariant = createVariant({
					messageId: this.message.id,
					match: combination,
					text: "",
				})

				this.dispatchEvent(
					createChangeEvent({
						type: "Variant",
						operation: "create",
						newData: newVariant,
					})
				)
			}
		}
	}

	private _generateNewMatcherCombinations = (props: {
		variantsMatcher: Record<Expression["arg"]["name"], string>[]
		newMatchers: string[]
		newSelectorName: string
	}): Array<Record<string, string>> => {
		const newMatchers = props.newMatchers.filter((category) => category !== "*")
		const newCombinations: Array<Record<string, string>> = []
		if (newMatchers) {
			for (const variantMatcher of props.variantsMatcher) {
				for (const category of newMatchers) {
					newCombinations.push({ ...variantMatcher, ...{ [props.newSelectorName]: category } })
				}
			}
		}
		return newCombinations
	}

	override async firstUpdated() {
		await this.updateComplete
		this._input = this._getInputs()?.[0]?.name
		this._function = "plural"
		this._matchers = this._getPluralCategories() || ["*"]
	}

	override render() {
		return html`
			<div class="dropdown-container">
				<div class="dropdown-item">
					<div class="dropdown-header">
						<p class="dropdown-title">Input</p>
						${this._isNewInput && this._getInputs() && this._getInputs().length > 0
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
								value=${this._input || this._getInputs()?.[0]}
						  >
								${this._getInputs() &&
								this._getInputs().map((input) => {
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
										// @ts-ignore -- .at seems not to be available in the type? @NilsJacobsen
										const lastInput = inputs && (inputs.at(-1) as HTMLInputElement)
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
					<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 256 256">
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
						}}
						size="medium"
						variant="primary"
						>Add selector</sl-button
					>
				</div>
			</div>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-add-selector": InlangAddSelector
	}
}
