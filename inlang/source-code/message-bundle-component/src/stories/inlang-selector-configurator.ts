import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"

import { createMessage, createVariant, type LanguageTag, type Message } from "@inlang/sdk/v2"
import { addSelector } from "../helper/crud/selector/add.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import "./inlang-add-input.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)

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
				background-color: white;
				border: 1px solid var(--sl-color-neutral-300);
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
				color: var(--sl-color-neutral-900);
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
				background-color: var(--sl-color-neutral-100);
				color: var(--sl-color-neutral-900);
			}
			sl-select::part(form-control-label) {
				font-size: 13px;
				color: var(--sl-color-neutral-700);
			}
			sl-select::part(display-input) {
				font-size: 13px;
				color: var(--sl-color-neutral-950);
			}
			sl-option::part(label) {
				font-size: 14px;
			}
			.options-title {
				font-size: 14px;
				color: var(--sl-color-neutral-700);
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
			.delete-icon {
				color: var(--sl-color-neutral-400);
				cursor: pointer;
			}
			.delete-icon:hover {
				color: var(--sl-color-neutral-900);
			}
			.help-text {
				display: flex;
				gap: 8px;
				color: var(--sl-color-neutral-900);
			}
			.help-text p {
				flex: 1;
				margin: 0;
				font-size: 12px;
				color: var(--sl-color-neutral-500);
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
		`,
	]

	@property()
	inputs: string[] | undefined

	@property()
	message?: Message | undefined

	@property()
	locale: LanguageTag | undefined

	@property()
	triggerMessageBundleRefresh: () => void = () => {}

	@property()
	addMessage: (newMessage: Message) => void = () => {}

	@state()
	private _input: string | undefined

	@state()
	private _function: string | undefined

	@state()
	private _matchers: string[] | undefined

	private _getPluralCategories = (): string[] | undefined => {
		return this.locale
			? [...new Intl.PluralRules(this.locale).resolvedOptions().pluralCategories, "*"]
			: undefined
	}

	private _handleAddSelector = (newMatchers: string[]) => {
		// get dropdown by "dropdown" class
		const dropdown = this.shadowRoot?.querySelector(".dropdown") as SlDropdown
		if (dropdown) dropdown.hide()

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
							name: "plural",
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

				// add plural options if present
				// TODO: for now always present
				this._addVariants({
					message: this.message,
					variantMatcherArrays: _variantMatcherArrays,
					newMatchers: newMatchers,
				})
			}

			this.triggerMessageBundleRefresh()
		}
	}

	private _addVariants = (props: {
		message: Message
		variantMatcherArrays: string[][]
		newMatchers: string[]
	}) => {
		if (props.newMatchers) {
			if (props.variantMatcherArrays && props.variantMatcherArrays.length > 0) {
				for (const variantMatcherArray of props.variantMatcherArrays) {
					for (const category of props.newMatchers) {
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
				for (const category of props.newMatchers) {
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
		this._input = this.inputs && this.inputs[0]
		this._function = "plural"
		this._matchers = this._getPluralCategories() || ["*"]
	}

	override async firstUpdated() {
		await this.updateComplete
		this._input = this.inputs && this.inputs[0]
		this._function = "plural"
		this._matchers = this._getPluralCategories() || ["*"]
	}

	override render() {
		return html`
			<sl-dropdown distance="-4" class="dropdown">
				<div slot="trigger" class="button-wrapper">
					<slot></slot>
				</div>
				${this.inputs && this.inputs.length > 0
					? html`<div class="dropdown-container">
							<div class="dropdown-item">
								<div class="dropdown-header">
									<p class="dropdown-title">Input</p>
									<inlang-add-input>
										<sl-tooltip content="Add input to message bundle">
											<sl-button class="add-input" variant="text" size="small"
												><svg
													viewBox="0 0 24 24"
													width="18"
													height="18"
													slot="prefix"
													style="margin: 0 -2px"
												>
													<path
														fill="currentColor"
														d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
													></path></svg
											></sl-button>
										</sl-tooltip>
									</inlang-add-input>
								</div>
								<sl-select
									@sl-change=${(e: CustomEvent) => {
										const inputElement = e.target as HTMLInputElement
										this._input = inputElement.value
									}}
									@sl-show=${(e: CustomEvent) => {
										const inputElement = e.target as HTMLInputElement
										this._input = inputElement.value
									}}
									size="small"
									value=${this.inputs && this.inputs[0]}
								>
									${this.inputs &&
									this.inputs.map((inputs) => {
										return html`<sl-option value=${inputs}>${inputs}</sl-option>`
									})}
								</sl-select>
							</div>
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
													const lastInput =
														inputs && (inputs[inputs.length - 1] as HTMLInputElement)
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
											this._handleAddSelector(this._matchers.filter((match) => match !== "*"))
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
					  </div>`
					: html`<div class="dropdown-container">
							<div class="dropdown-item">
								<div class="dropdown-header">
									<p class="dropdown-title">Input</p>
									<sl-button class="add-input" variant="text" size="small"
										><svg
											viewBox="0 0 24 24"
											width="18"
											height="18"
											slot="prefix"
											style="margin: 0 -2px"
										>
											<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path></svg
									></sl-button>
								</div>
								<div class="empty-image">${emptyInputsSVG}</div>
							</div>
							<div class="help-text">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24px"
									height="24px"
									viewBox="0 0 240 240"
								>
									<path
										fill="currentColor"
										d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"
									/>
								</svg>
								<p>
									In order to create a selector there must be at least one input present on the
									bundle.
								</p>
							</div>
							<div class="actions">
								<sl-button size="small" variant="secondary" disabled>Add selector</sl-button>
							</div>
					  </div>`}
			</sl-dropdown>
		`
	}
}

const emptyInputsSVG = html`<svg
	width="246"
	height="107"
	viewBox="0 0 246 107"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<rect
		opacity="0.5"
		x="75"
		y="7.5"
		width="96"
		height="96"
		rx="48"
		fill="url(#paint0_linear_295_676)"
		stroke="url(#paint1_linear_295_676)"
	/>
	<rect
		opacity="0.5"
		x="99"
		y="31.5"
		width="48"
		height="48"
		rx="24"
		fill="url(#paint2_linear_295_676)"
		stroke="url(#paint3_linear_295_676)"
	/>
	<path
		d="M113.625 57.0631C113.625 54.2561 114.867 51.6201 117.034 49.8311L118.029 51.0357C117.139 51.768 116.423 52.6884 115.932 53.7306C115.441 54.7728 115.186 55.9109 115.187 57.0631C115.187 61.3709 118.692 64.8756 123 64.8756C127.308 64.8756 130.812 61.3709 130.812 57.0631C130.814 55.9109 130.559 54.7728 130.068 53.7306C129.577 52.6884 128.861 51.768 127.971 51.0357L128.966 49.8311C130.034 50.7096 130.893 51.8139 131.483 53.0644C132.072 54.315 132.377 55.6806 132.375 57.0631C132.375 62.2326 128.17 66.4381 123 66.4381C117.83 66.4381 113.625 62.2326 113.625 57.0631Z"
		fill="black"
	/>
	<path
		d="M123 60.9688L128.469 55.5L127.364 54.3953L123.781 57.9781V44.5625H122.219V57.9781L118.636 54.3953L117.531 55.5L123 60.9688Z"
		fill="black"
	/>
	<path
		d="M207.743 32.9137C207.427 33.0134 207.251 33.3503 207.351 33.6664C207.451 33.9824 207.788 34.1578 208.104 34.0582L207.743 32.9137ZM230.566 1.16758C230.376 0.896685 230.001 0.831788 229.73 1.02263L225.316 4.13259C225.045 4.32343 224.98 4.69775 225.171 4.96865C225.362 5.23954 225.736 5.30444 226.007 5.1136L229.931 2.34919L232.695 6.27322C232.886 6.54412 233.26 6.60902 233.531 6.41818C233.802 6.22734 233.867 5.85302 233.676 5.58212L230.566 1.16758ZM208.104 34.0582C217.082 31.228 222.054 27.2496 225.112 21.8381C228.139 16.4811 229.254 9.76801 230.667 1.61563L229.485 1.41064C228.059 9.63471 226.97 16.111 224.068 21.2478C221.196 26.3301 216.511 30.1499 207.743 32.9137L208.104 34.0582Z"
		fill="#9CA3AF"
	/>
	<path
		d="M170.826 17.768C170.766 17.972 170.688 18.158 170.592 18.326C170.496 18.482 170.394 18.572 170.286 18.596C170.058 18.656 169.884 18.62 169.764 18.488C169.644 18.356 169.596 18.188 169.62 17.984C169.716 17.264 169.872 16.508 170.088 15.716C170.304 14.912 170.556 14.114 170.844 13.322C171.132 12.518 171.444 11.744 171.78 11C172.128 10.244 172.482 9.56 172.842 8.948C172.902 8.852 172.968 8.798 173.04 8.786C173.124 8.762 173.196 8.762 173.256 8.786C173.316 8.738 173.388 8.696 173.472 8.66C173.556 8.624 173.64 8.606 173.724 8.606C173.76 8.606 173.796 8.612 173.832 8.624C173.88 8.636 173.928 8.672 173.976 8.732C174.024 8.792 174.078 8.882 174.138 9.002C174.21 9.11 174.294 9.272 174.39 9.488C174.558 10.1 174.75 10.73 174.966 11.378C175.194 12.026 175.428 12.674 175.668 13.322C175.704 13.31 175.734 13.304 175.758 13.304C175.794 13.292 175.83 13.28 175.866 13.268C175.998 13.256 176.148 13.262 176.316 13.286C176.484 13.31 176.598 13.394 176.658 13.538C176.73 13.718 176.718 13.874 176.622 14.006C176.526 14.138 176.352 14.27 176.1 14.402C176.256 14.786 176.412 15.164 176.568 15.536C176.724 15.896 176.886 16.25 177.054 16.598C177.066 16.658 177.084 16.754 177.108 16.886C177.132 17.006 177.144 17.132 177.144 17.264C177.156 17.384 177.15 17.498 177.126 17.606C177.102 17.714 177.054 17.786 176.982 17.822C176.898 17.858 176.808 17.852 176.712 17.804C176.628 17.756 176.544 17.696 176.46 17.624C176.376 17.54 176.298 17.456 176.226 17.372C176.166 17.276 176.118 17.192 176.082 17.12C175.878 16.724 175.68 16.328 175.488 15.932C175.308 15.524 175.134 15.116 174.966 14.708C174.462 14.804 173.91 14.888 173.31 14.96C172.722 15.032 172.14 15.08 171.564 15.104C171.432 15.56 171.3 16.01 171.168 16.454C171.048 16.886 170.934 17.324 170.826 17.768ZM173.382 10.208C172.83 11.444 172.35 12.68 171.942 13.916C172.746 13.892 173.604 13.79 174.516 13.61C174.084 12.518 173.706 11.384 173.382 10.208ZM181.355 8.624C181.319 8.408 181.331 8.21 181.391 8.03C181.463 7.85 181.601 7.748 181.805 7.724C181.985 7.7 182.141 7.748 182.273 7.868C182.417 7.988 182.507 8.144 182.543 8.336C182.783 9.716 183.005 11.09 183.209 12.458C183.425 13.814 183.617 15.146 183.785 16.454C183.833 16.802 183.809 17.042 183.713 17.174C183.617 17.294 183.503 17.384 183.371 17.444C183.227 17.504 183.089 17.504 182.957 17.444C182.837 17.384 182.759 17.276 182.723 17.12L182.705 17.012L182.633 17.03C182.237 17.174 181.823 17.258 181.391 17.282C180.959 17.294 180.545 17.24 180.149 17.12C179.753 17 179.399 16.808 179.087 16.544C178.787 16.268 178.571 15.92 178.439 15.5C178.151 14.576 178.331 13.736 178.979 12.98C179.255 12.668 179.597 12.386 180.005 12.134C180.413 11.882 180.905 11.684 181.481 11.54L181.805 11.468L181.355 8.624ZM179.537 15.05C179.609 15.338 179.741 15.56 179.933 15.716C180.125 15.872 180.353 15.98 180.617 16.04C180.881 16.088 181.163 16.094 181.463 16.058C181.763 16.022 182.057 15.956 182.345 15.86L182.507 15.806L182.003 12.638L181.643 12.728C181.391 12.8 181.121 12.914 180.833 13.07C180.557 13.214 180.311 13.388 180.095 13.592C179.879 13.796 179.711 14.024 179.591 14.276C179.483 14.528 179.465 14.786 179.537 15.05ZM187.789 8.624C187.753 8.408 187.765 8.21 187.825 8.03C187.897 7.85 188.035 7.748 188.239 7.724C188.419 7.7 188.575 7.748 188.707 7.868C188.851 7.988 188.941 8.144 188.977 8.336C189.217 9.716 189.439 11.09 189.643 12.458C189.859 13.814 190.051 15.146 190.219 16.454C190.267 16.802 190.243 17.042 190.147 17.174C190.051 17.294 189.937 17.384 189.805 17.444C189.661 17.504 189.523 17.504 189.391 17.444C189.271 17.384 189.193 17.276 189.157 17.12L189.139 17.012L189.067 17.03C188.671 17.174 188.257 17.258 187.825 17.282C187.393 17.294 186.979 17.24 186.583 17.12C186.187 17 185.833 16.808 185.521 16.544C185.221 16.268 185.005 15.92 184.873 15.5C184.585 14.576 184.765 13.736 185.413 12.98C185.689 12.668 186.031 12.386 186.439 12.134C186.847 11.882 187.339 11.684 187.915 11.54L188.239 11.468L187.789 8.624ZM185.971 15.05C186.043 15.338 186.175 15.56 186.367 15.716C186.559 15.872 186.787 15.98 187.051 16.04C187.315 16.088 187.597 16.094 187.897 16.058C188.197 16.022 188.491 15.956 188.779 15.86L188.941 15.806L188.437 12.638L188.077 12.728C187.825 12.8 187.555 12.914 187.267 13.07C186.991 13.214 186.745 13.388 186.529 13.592C186.313 13.796 186.145 14.024 186.025 14.276C185.917 14.528 185.899 14.786 185.971 15.05ZM200.365 11.468C200.725 11.6 201.025 11.798 201.265 12.062C201.517 12.326 201.709 12.626 201.841 12.962C201.973 13.286 202.045 13.622 202.057 13.97C202.081 14.318 202.045 14.642 201.949 14.942C201.817 15.278 201.649 15.608 201.445 15.932C201.241 16.256 201.007 16.544 200.743 16.796C200.479 17.048 200.179 17.252 199.843 17.408C199.507 17.564 199.135 17.642 198.727 17.642C198.235 17.642 197.821 17.528 197.485 17.3C197.149 17.072 196.885 16.778 196.693 16.418C196.501 16.058 196.375 15.65 196.315 15.194C196.267 14.738 196.279 14.282 196.351 13.826C196.399 13.49 196.477 13.166 196.585 12.854C196.705 12.53 196.855 12.248 197.035 12.008C197.215 11.756 197.419 11.552 197.647 11.396C197.887 11.24 198.157 11.162 198.457 11.162C198.625 11.162 198.835 11.198 199.087 11.27C199.339 11.33 199.573 11.42 199.789 11.54C199.945 11.396 200.137 11.372 200.365 11.468ZM199.681 12.782C199.549 12.698 199.393 12.59 199.213 12.458C199.045 12.314 198.895 12.242 198.763 12.242C198.619 12.242 198.475 12.308 198.331 12.44C198.199 12.572 198.079 12.728 197.971 12.908C197.875 13.076 197.791 13.25 197.719 13.43C197.647 13.61 197.599 13.754 197.575 13.862C197.539 14.042 197.515 14.258 197.503 14.51C197.491 14.762 197.509 15.014 197.557 15.266C197.605 15.506 197.695 15.728 197.827 15.932C197.971 16.124 198.181 16.262 198.457 16.346C198.625 16.394 198.823 16.394 199.051 16.346C199.279 16.286 199.501 16.184 199.717 16.04C199.945 15.896 200.155 15.704 200.347 15.464C200.551 15.224 200.707 14.948 200.815 14.636C200.935 14.288 200.935 13.928 200.815 13.556C200.707 13.172 200.479 12.896 200.131 12.728C200.047 12.788 199.963 12.818 199.879 12.818C199.795 12.818 199.729 12.806 199.681 12.782ZM204.655 11.81C204.691 11.99 204.727 12.194 204.763 12.422C204.811 12.638 204.859 12.866 204.907 13.106C204.955 13.334 204.997 13.568 205.033 13.808C205.069 14.048 205.099 14.276 205.123 14.492C205.267 14.18 205.423 13.85 205.591 13.502C205.759 13.154 205.939 12.836 206.131 12.548C206.335 12.248 206.545 12.002 206.761 11.81C206.989 11.618 207.235 11.522 207.499 11.522C207.895 11.522 208.225 11.666 208.489 11.954C208.765 12.242 208.993 12.602 209.173 13.034C209.365 13.454 209.515 13.898 209.623 14.366C209.731 14.834 209.821 15.248 209.893 15.608C209.965 15.932 209.821 16.172 209.461 16.328C209.293 16.412 209.167 16.424 209.083 16.364C208.999 16.304 208.951 16.244 208.939 16.184C208.879 16.04 208.801 15.788 208.705 15.428C208.621 15.068 208.519 14.702 208.399 14.33C208.291 13.958 208.165 13.634 208.021 13.358C207.877 13.082 207.715 12.956 207.535 12.98C207.319 12.992 207.127 13.154 206.959 13.466C206.815 13.718 206.665 14 206.509 14.312C206.365 14.612 206.221 14.924 206.077 15.248C205.933 15.56 205.789 15.878 205.645 16.202C205.513 16.514 205.387 16.802 205.267 17.066C205.183 17.15 205.075 17.21 204.943 17.246C204.823 17.27 204.697 17.258 204.565 17.21C204.445 17.174 204.349 17.114 204.277 17.03C204.205 16.946 204.169 16.862 204.169 16.778C204.061 15.842 203.947 14.99 203.827 14.222C203.719 13.454 203.575 12.668 203.395 11.864C203.311 11.588 203.293 11.372 203.341 11.216C203.401 11.048 203.581 10.982 203.881 11.018C204.301 11.09 204.559 11.354 204.655 11.81ZM215.488 13.52C215.02 13.796 214.516 14.012 213.976 14.168C213.436 14.312 212.854 14.384 212.23 14.384C212.254 14.804 212.374 15.14 212.59 15.392C212.806 15.632 213.076 15.776 213.4 15.824C213.592 15.848 213.784 15.842 213.976 15.806C214.18 15.77 214.366 15.716 214.534 15.644C214.714 15.56 214.876 15.47 215.02 15.374C215.164 15.278 215.29 15.182 215.398 15.086C215.506 14.99 215.62 14.93 215.74 14.906C215.86 14.87 215.95 14.864 216.01 14.888C216.178 14.948 216.238 15.128 216.19 15.428C215.998 15.812 215.722 16.142 215.362 16.418C215.002 16.682 214.6 16.85 214.156 16.922C213.772 16.994 213.376 16.976 212.968 16.868C212.56 16.76 212.194 16.55 211.87 16.238C211.594 15.962 211.384 15.638 211.24 15.266C211.096 14.894 211.006 14.51 210.97 14.114C210.934 13.742 210.964 13.388 211.06 13.052C211.168 12.716 211.33 12.422 211.546 12.17C211.762 11.906 212.032 11.69 212.356 11.522C212.68 11.354 213.058 11.258 213.49 11.234C214.006 11.198 214.474 11.294 214.894 11.522C215.314 11.75 215.608 12.068 215.776 12.476C215.872 12.704 215.896 12.902 215.848 13.07C215.812 13.238 215.692 13.388 215.488 13.52ZM213.418 12.296C213.298 12.32 213.166 12.362 213.022 12.422C212.89 12.482 212.764 12.56 212.644 12.656C212.536 12.74 212.434 12.842 212.338 12.962C212.254 13.07 212.206 13.196 212.194 13.34C212.398 13.34 212.62 13.322 212.86 13.286C213.112 13.25 213.352 13.208 213.58 13.16C213.82 13.1 214.036 13.034 214.228 12.962C214.432 12.89 214.6 12.812 214.732 12.728C214.636 12.5 214.456 12.362 214.192 12.314C213.94 12.254 213.682 12.248 213.418 12.296Z"
		fill="#9CA3AF"
	/>
	<path
		d="M100.187 92.8182V103H98.7753L93.5999 95.5327H93.5054V103H91.9692V92.8182H93.3911L98.5715 100.295H98.6659V92.8182H100.187ZM105.525 103.154C104.81 103.154 104.185 102.99 103.651 102.662C103.118 102.334 102.703 101.875 102.408 101.285C102.113 100.695 101.966 100.005 101.966 99.2166C101.966 98.4245 102.113 97.7318 102.408 97.1385C102.703 96.5452 103.118 96.0845 103.651 95.7564C104.185 95.4283 104.81 95.2642 105.525 95.2642C106.241 95.2642 106.866 95.4283 107.4 95.7564C107.933 96.0845 108.348 96.5452 108.643 97.1385C108.938 97.7318 109.085 98.4245 109.085 99.2166C109.085 100.005 108.938 100.695 108.643 101.285C108.348 101.875 107.933 102.334 107.4 102.662C106.866 102.99 106.241 103.154 105.525 103.154ZM105.53 101.906C105.994 101.906 106.379 101.784 106.684 101.538C106.989 101.293 107.214 100.967 107.36 100.559C107.509 100.151 107.584 99.7022 107.584 99.2116C107.584 98.7244 107.509 98.277 107.36 97.8693C107.214 97.4583 106.989 97.1286 106.684 96.88C106.379 96.6314 105.994 96.5071 105.53 96.5071C105.063 96.5071 104.675 96.6314 104.367 96.88C104.062 97.1286 103.835 97.4583 103.686 97.8693C103.54 98.277 103.467 98.7244 103.467 99.2116C103.467 99.7022 103.54 100.151 103.686 100.559C103.835 100.967 104.062 101.293 104.367 101.538C104.675 101.784 105.063 101.906 105.53 101.906ZM116.105 92.8182V103H114.569V92.8182H116.105ZM119.709 98.4659V103H118.223V95.3636H119.65V96.6065H119.744C119.92 96.2022 120.195 95.8774 120.57 95.6321C120.947 95.3868 121.423 95.2642 121.996 95.2642C122.517 95.2642 122.972 95.3736 123.364 95.5923C123.755 95.8078 124.058 96.1293 124.273 96.5568C124.489 96.9844 124.597 97.513 124.597 98.1428V103H123.11V98.3217C123.11 97.7682 122.966 97.3357 122.677 97.0241C122.389 96.7093 121.993 96.5518 121.489 96.5518C121.145 96.5518 120.838 96.6264 120.57 96.7756C120.304 96.9247 120.094 97.1435 119.938 97.4318C119.786 97.7169 119.709 98.0616 119.709 98.4659ZM126.59 105.864V95.3636H128.042V96.6016H128.166C128.252 96.4425 128.377 96.2585 128.539 96.0497C128.701 95.8409 128.927 95.6586 129.215 95.5028C129.503 95.3438 129.885 95.2642 130.359 95.2642C130.975 95.2642 131.525 95.42 132.009 95.7315C132.493 96.0431 132.873 96.4922 133.148 97.0788C133.426 97.6655 133.565 98.3714 133.565 99.1967C133.565 100.022 133.428 100.73 133.153 101.32C132.878 101.906 132.5 102.359 132.019 102.677C131.539 102.992 130.99 103.149 130.373 103.149C129.909 103.149 129.53 103.071 129.235 102.915C128.943 102.76 128.715 102.577 128.549 102.369C128.383 102.16 128.256 101.974 128.166 101.812H128.077V105.864H126.59ZM128.047 99.1818C128.047 99.7187 128.125 100.189 128.28 100.594C128.436 100.998 128.662 101.315 128.957 101.543C129.252 101.769 129.613 101.881 130.04 101.881C130.485 101.881 130.856 101.764 131.154 101.528C131.452 101.29 131.678 100.967 131.83 100.559C131.986 100.151 132.064 99.6922 132.064 99.1818C132.064 98.678 131.988 98.2256 131.835 97.8246C131.686 97.4235 131.461 97.107 131.159 96.875C130.861 96.643 130.488 96.527 130.04 96.527C129.61 96.527 129.245 96.638 128.947 96.8601C128.652 97.0821 128.428 97.392 128.275 97.7898C128.123 98.1875 128.047 98.6515 128.047 99.1818ZM140.068 99.8331V95.3636H141.56V103H140.098V101.678H140.018C139.843 102.085 139.561 102.425 139.173 102.697C138.789 102.965 138.31 103.099 137.736 103.099C137.246 103.099 136.812 102.992 136.434 102.776C136.059 102.558 135.764 102.234 135.549 101.807C135.337 101.379 135.231 100.851 135.231 100.221V95.3636H136.717V100.042C136.717 100.562 136.861 100.977 137.15 101.285C137.438 101.593 137.813 101.747 138.273 101.747C138.552 101.747 138.829 101.678 139.104 101.538C139.382 101.399 139.612 101.189 139.795 100.907C139.98 100.625 140.071 100.267 140.068 99.8331ZM147.122 95.3636V96.5568H142.95V95.3636H147.122ZM144.069 93.5341H145.555V100.758C145.555 101.046 145.599 101.263 145.685 101.409C145.771 101.552 145.882 101.649 146.018 101.702C146.157 101.752 146.308 101.777 146.47 101.777C146.59 101.777 146.694 101.769 146.783 101.752C146.873 101.736 146.943 101.722 146.992 101.712L147.261 102.94C147.175 102.973 147.052 103.007 146.893 103.04C146.734 103.076 146.535 103.096 146.296 103.099C145.905 103.106 145.541 103.036 145.203 102.891C144.864 102.745 144.591 102.519 144.382 102.214C144.173 101.91 144.069 101.527 144.069 101.066V93.5341ZM154.365 97.228L153.018 97.4666C152.961 97.2943 152.872 97.1302 152.749 96.9744C152.63 96.8187 152.468 96.6911 152.262 96.5916C152.057 96.4922 151.8 96.4425 151.492 96.4425C151.071 96.4425 150.719 96.5369 150.438 96.7259C150.156 96.9115 150.015 97.1518 150.015 97.4467C150.015 97.7019 150.109 97.9074 150.298 98.0632C150.487 98.219 150.792 98.3466 151.213 98.446L152.426 98.7244C153.129 98.8868 153.653 99.1371 153.997 99.4751C154.342 99.8132 154.514 100.252 154.514 100.793C154.514 101.25 154.382 101.658 154.117 102.016C153.855 102.37 153.488 102.649 153.018 102.851C152.551 103.053 152.009 103.154 151.392 103.154C150.537 103.154 149.839 102.972 149.299 102.607C148.759 102.239 148.427 101.717 148.305 101.041L149.742 100.822C149.831 101.197 150.015 101.48 150.293 101.673C150.572 101.862 150.935 101.956 151.382 101.956C151.869 101.956 152.259 101.855 152.551 101.653C152.842 101.447 152.988 101.197 152.988 100.902C152.988 100.663 152.899 100.463 152.72 100.3C152.544 100.138 152.274 100.015 151.909 99.9325L150.617 99.6491C149.904 99.4867 149.377 99.2282 149.036 98.8736C148.698 98.5189 148.528 98.0698 148.528 97.5263C148.528 97.0755 148.654 96.6811 148.906 96.343C149.158 96.005 149.506 95.7415 149.95 95.5526C150.395 95.3603 150.903 95.2642 151.477 95.2642C152.302 95.2642 152.952 95.4432 153.426 95.8011C153.899 96.1558 154.213 96.6314 154.365 97.228Z"
		fill="#111827"
	/>
	<defs>
		<linearGradient
			id="paint0_linear_295_676"
			x1="123"
			y1="7"
			x2="123"
			y2="104"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#D1D5DB" />
			<stop offset="1" stop-color="#D1D5DB" stop-opacity="0" />
		</linearGradient>
		<linearGradient
			id="paint1_linear_295_676"
			x1="123"
			y1="7"
			x2="123"
			y2="104"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#9CA3AF" />
			<stop offset="1" stop-color="#9CA3AF" stop-opacity="0" />
		</linearGradient>
		<linearGradient
			id="paint2_linear_295_676"
			x1="123"
			y1="31"
			x2="123"
			y2="80"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#D1D5DB" />
			<stop offset="1" stop-color="#D1D5DB" stop-opacity="0" />
		</linearGradient>
		<linearGradient
			id="paint3_linear_295_676"
			x1="123"
			y1="31"
			x2="123"
			y2="80"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#9CA3AF" />
			<stop offset="1" stop-color="#9CA3AF" stop-opacity="0" />
		</linearGradient>
	</defs>
</svg>`

declare global {
	interface HTMLElementTagNameMap {
		"inlang-selector-configurator": InlangSelectorConfigurator
	}
}
