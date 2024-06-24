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
			<sl-dropdown
				distance="-4"
				class="dropdown"
				@sl-show=${(e: CustomEvent) => {
					const dropdown = this.shadowRoot?.querySelector("sl-dropdown")
					if (dropdown) {
						if (e.target === dropdown) {
							this._input = this.inputs && this.inputs.length > 0 ? this.inputs[0] : undefined
						}
					}
				}}
			>
				<div slot="trigger" class="button-wrapper">
					<slot></slot>
				</div>
				${this.inputs && this.inputs.length > 0
					? html`<div class="dropdown-container">
							<div class="dropdown-item">
								<div class="dropdown-header">
									<p class="dropdown-title">Input</p>
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
									value=${this._input || this.inputs[0]}
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
					  </div>`
					: html`<div class="dropdown-container">
							<div class="empty-image">${emptyInputsSVG}</div>
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
	width="240"
	viewBox="0 0 246 119"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<rect
		opacity="0.5"
		x="75"
		y="3.5"
		width="96"
		height="96"
		rx="48"
		fill="url(#paint0_linear_295_676)"
		stroke="url(#paint1_linear_295_676)"
	/>
	<rect
		opacity="0.5"
		x="99"
		y="27.5"
		width="48"
		height="48"
		rx="24"
		fill="url(#paint2_linear_295_676)"
		stroke="url(#paint3_linear_295_676)"
	/>
	<path
		d="M113.625 53.0631C113.625 50.2561 114.867 47.6201 117.034 45.8311L118.029 47.0357C117.139 47.768 116.423 48.6884 115.932 49.7306C115.441 50.7728 115.186 51.9109 115.187 53.0631C115.187 57.3709 118.692 60.8756 123 60.8756C127.308 60.8756 130.812 57.3709 130.812 53.0631C130.814 51.9109 130.559 50.7728 130.068 49.7306C129.577 48.6884 128.861 47.768 127.971 47.0357L128.966 45.8311C130.034 46.7096 130.893 47.8139 131.483 49.0644C132.072 50.315 132.377 51.6806 132.375 53.0631C132.375 58.2326 128.17 62.4381 123 62.4381C117.83 62.4381 113.625 58.2326 113.625 53.0631Z"
		fill="black"
	/>
	<path
		d="M123 56.9688L128.469 51.5L127.364 50.3953L123.781 53.9781V40.5625H122.219V53.9781L118.636 50.3953L117.531 51.5L123 56.9688Z"
		fill="black"
	/>
	<path
		d="M100.187 104.818V115H98.7753L93.5999 107.533H93.5054V115H91.9692V104.818H93.3911L98.5715 112.295H98.6659V104.818H100.187ZM105.525 115.154C104.81 115.154 104.185 114.99 103.651 114.662C103.118 114.334 102.703 113.875 102.408 113.285C102.113 112.695 101.966 112.005 101.966 111.217C101.966 110.424 102.113 109.732 102.408 109.138C102.703 108.545 103.118 108.085 103.651 107.756C104.185 107.428 104.81 107.264 105.525 107.264C106.241 107.264 106.866 107.428 107.4 107.756C107.933 108.085 108.348 108.545 108.643 109.138C108.938 109.732 109.085 110.424 109.085 111.217C109.085 112.005 108.938 112.695 108.643 113.285C108.348 113.875 107.933 114.334 107.4 114.662C106.866 114.99 106.241 115.154 105.525 115.154ZM105.53 113.906C105.994 113.906 106.379 113.784 106.684 113.538C106.989 113.293 107.214 112.967 107.36 112.559C107.509 112.151 107.584 111.702 107.584 111.212C107.584 110.724 107.509 110.277 107.36 109.869C107.214 109.458 106.989 109.129 106.684 108.88C106.379 108.631 105.994 108.507 105.53 108.507C105.063 108.507 104.675 108.631 104.367 108.88C104.062 109.129 103.835 109.458 103.686 109.869C103.54 110.277 103.467 110.724 103.467 111.212C103.467 111.702 103.54 112.151 103.686 112.559C103.835 112.967 104.062 113.293 104.367 113.538C104.675 113.784 105.063 113.906 105.53 113.906ZM116.105 104.818V115H114.569V104.818H116.105ZM119.709 110.466V115H118.223V107.364H119.65V108.607H119.744C119.92 108.202 120.195 107.877 120.57 107.632C120.947 107.387 121.423 107.264 121.996 107.264C122.517 107.264 122.972 107.374 123.364 107.592C123.755 107.808 124.058 108.129 124.273 108.557C124.489 108.984 124.597 109.513 124.597 110.143V115H123.11V110.322C123.11 109.768 122.966 109.336 122.677 109.024C122.389 108.709 121.993 108.552 121.489 108.552C121.145 108.552 120.838 108.626 120.57 108.776C120.304 108.925 120.094 109.143 119.938 109.432C119.786 109.717 119.709 110.062 119.709 110.466ZM126.59 117.864V107.364H128.042V108.602H128.166C128.252 108.442 128.377 108.259 128.539 108.05C128.701 107.841 128.927 107.659 129.215 107.503C129.503 107.344 129.885 107.264 130.359 107.264C130.975 107.264 131.525 107.42 132.009 107.732C132.493 108.043 132.873 108.492 133.148 109.079C133.426 109.665 133.565 110.371 133.565 111.197C133.565 112.022 133.428 112.73 133.153 113.32C132.878 113.906 132.5 114.359 132.019 114.677C131.539 114.992 130.99 115.149 130.373 115.149C129.909 115.149 129.53 115.071 129.235 114.915C128.943 114.76 128.715 114.577 128.549 114.369C128.383 114.16 128.256 113.974 128.166 113.812H128.077V117.864H126.59ZM128.047 111.182C128.047 111.719 128.125 112.189 128.28 112.594C128.436 112.998 128.662 113.315 128.957 113.543C129.252 113.769 129.613 113.881 130.04 113.881C130.485 113.881 130.856 113.764 131.154 113.528C131.452 113.29 131.678 112.967 131.83 112.559C131.986 112.151 132.064 111.692 132.064 111.182C132.064 110.678 131.988 110.226 131.835 109.825C131.686 109.424 131.461 109.107 131.159 108.875C130.861 108.643 130.488 108.527 130.04 108.527C129.61 108.527 129.245 108.638 128.947 108.86C128.652 109.082 128.428 109.392 128.275 109.79C128.123 110.187 128.047 110.652 128.047 111.182ZM140.068 111.833V107.364H141.56V115H140.098V113.678H140.018C139.843 114.085 139.561 114.425 139.173 114.697C138.789 114.965 138.31 115.099 137.736 115.099C137.246 115.099 136.812 114.992 136.434 114.776C136.059 114.558 135.764 114.234 135.549 113.807C135.337 113.379 135.231 112.851 135.231 112.221V107.364H136.717V112.042C136.717 112.562 136.861 112.977 137.15 113.285C137.438 113.593 137.813 113.747 138.273 113.747C138.552 113.747 138.829 113.678 139.104 113.538C139.382 113.399 139.612 113.189 139.795 112.907C139.98 112.625 140.071 112.267 140.068 111.833ZM147.122 107.364V108.557H142.95V107.364H147.122ZM144.069 105.534H145.555V112.758C145.555 113.046 145.599 113.263 145.685 113.409C145.771 113.552 145.882 113.649 146.018 113.702C146.157 113.752 146.308 113.777 146.47 113.777C146.59 113.777 146.694 113.769 146.783 113.752C146.873 113.736 146.943 113.722 146.992 113.712L147.261 114.94C147.175 114.973 147.052 115.007 146.893 115.04C146.734 115.076 146.535 115.096 146.296 115.099C145.905 115.106 145.541 115.036 145.203 114.891C144.864 114.745 144.591 114.519 144.382 114.214C144.173 113.91 144.069 113.527 144.069 113.066V105.534ZM154.365 109.228L153.018 109.467C152.961 109.294 152.872 109.13 152.749 108.974C152.63 108.819 152.468 108.691 152.262 108.592C152.057 108.492 151.8 108.442 151.492 108.442C151.071 108.442 150.719 108.537 150.438 108.726C150.156 108.911 150.015 109.152 150.015 109.447C150.015 109.702 150.109 109.907 150.298 110.063C150.487 110.219 150.792 110.347 151.213 110.446L152.426 110.724C153.129 110.887 153.653 111.137 153.997 111.475C154.342 111.813 154.514 112.252 154.514 112.793C154.514 113.25 154.382 113.658 154.117 114.016C153.855 114.37 153.488 114.649 153.018 114.851C152.551 115.053 152.009 115.154 151.392 115.154C150.537 115.154 149.839 114.972 149.299 114.607C148.759 114.239 148.427 113.717 148.305 113.041L149.742 112.822C149.831 113.197 150.015 113.48 150.293 113.673C150.572 113.862 150.935 113.956 151.382 113.956C151.869 113.956 152.259 113.855 152.551 113.653C152.842 113.447 152.988 113.197 152.988 112.902C152.988 112.663 152.899 112.463 152.72 112.3C152.544 112.138 152.274 112.015 151.909 111.933L150.617 111.649C149.904 111.487 149.377 111.228 149.036 110.874C148.698 110.519 148.528 110.07 148.528 109.526C148.528 109.076 148.654 108.681 148.906 108.343C149.158 108.005 149.506 107.741 149.95 107.553C150.395 107.36 150.903 107.264 151.477 107.264C152.302 107.264 152.952 107.443 153.426 107.801C153.899 108.156 154.213 108.631 154.365 109.228Z"
		fill="#111827"
	/>
	<defs>
		<linearGradient
			id="paint0_linear_295_676"
			x1="123"
			y1="3"
			x2="123"
			y2="100"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#D1D5DB" />
			<stop offset="1" stop-color="#D1D5DB" stop-opacity="0" />
		</linearGradient>
		<linearGradient
			id="paint1_linear_295_676"
			x1="123"
			y1="3"
			x2="123"
			y2="100"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#9CA3AF" />
			<stop offset="1" stop-color="#9CA3AF" stop-opacity="0" />
		</linearGradient>
		<linearGradient
			id="paint2_linear_295_676"
			x1="123"
			y1="27"
			x2="123"
			y2="76"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="#D1D5DB" />
			<stop offset="1" stop-color="#D1D5DB" stop-opacity="0" />
		</linearGradient>
		<linearGradient
			id="paint3_linear_295_676"
			x1="123"
			y1="27"
			x2="123"
			y2="76"
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
