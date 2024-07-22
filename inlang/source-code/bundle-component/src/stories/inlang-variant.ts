import {
	type Variant,
	type Message,
	type LanguageTag,
	type LintReport,
	type InstalledLintRule,
	type Declaration,
} from "@inlang/sdk/v2"
import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

//helpers
import deleteVariant from "../helper/crud/variant/delete.js"
import updateMatch from "../helper/crud/variant/updateMatch.js"

// internal components
import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"
import "./pattern-editor/inlang-pattern-editor.js"

@customElement("inlang-variant")
export default class InlangVariant extends LitElement {
	static override styles = [
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
			}
			:host {
				border-top: 1px solid var(--sl-input-border-color);
			}
			:host(:first-child) {
				border-top: none;
			}
			.variant {
				position: relative;
				min-height: 44px;
				width: 100%;
				display: flex;
				align-items: stretch;
			}
			.match {
				min-height: 44px;
				width: 120px;
				background-color: var(--sl-input-background-color);
				border-right: 1px solid var(--sl-input-border-color);
				position: relative;
				z-index: 0;
			}
			.match:focus-within {
				z-index: 1;
			}
			.match::part(base) {
				border: none;
				border-radius: 0;
				min-height: 44px;
			}
			.match::part(input) {
				min-height: 44px;
			}
			.match::part(input):hover {
				background-color: var(--sl-input-background-color-);
			}
			.pattern {
				flex: 1;
				background-color: none;
				height: 44px;
				position: relative;
				z-index: 0;
			}
			.pattern:focus-within {
				z-index: 1;
			}
			.pattern::part(base) {
				border: none;
				border-radius: 0;
				min-height: 44px;
				background-color: var(--sl-input-background-color);
			}
			.pattern::part(input) {
				min-height: 44px;
			}
			.pattern::part(input):hover {
				background-color: var(--sl-input-background-color-hover);
			}
			.pattern::part(input)::placeholder {
				color: var(--sl-input-placeholder-color);
				font-size: 13px;
			}
			.actions {
				position: absolute;
				top: 0;
				right: 0;
				height: 44px;
				display: flex;
				align-items: center;
				gap: 4px;
				padding-right: 12px;
				z-index: 1;
			}
			.add-selector::part(base) {
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
			}
			sl-button::part(base) {
				color: var(--sl-input-color);
				background-color: var(--sl-input-background-color);
				border: 1px solid var(--sl-input-border-color);
			}
			sl-button::part(base):hover {
				color: var(--sl-input-color-hover);
				background-color: var(--sl-input-background-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
			.dynamic-actions {
				display: flex;
				align-items: center;
				gap: 4px;
				z-index: 2;
			}
			.hide-dynamic-actions {
				display: none;
			}
			.variant:hover .dynamic-actions {
				display: flex;
			}
			.dropdown-open.dynamic-actions {
				display: flex;
			}
			sl-tooltip::part(base) {
				background-color: var(--sl-tooltip-background-color);
				color: var(--sl-tooltip-color);
			}
		`,
	]

	//props
	@property()
	message: Message | undefined

	@property()
	locale: LanguageTag | undefined

	@property()
	variant: Variant | undefined

	@property()
	inputs: Declaration[] | undefined

	@property()
	lintReports: LintReport[] | undefined

	@property()
	installedLintRules: InstalledLintRule[] | undefined

	@property()
	setHoveredVariantId: (variantId: string | undefined) => void = () => {}

	@property()
	addMessage: (newMessage: Message) => void = () => {}

	@property()
	addInput: (inputName: string) => void = () => {}

	@property()
	triggerMessageBundleRefresh: () => void = () => {}

	@property()
	triggerSave: () => void = () => {}

	@property()
	fixLint: (lintReport: LintReport, fix: LintReport["fixes"][0]["title"]) => void = () => {}

	// @property()
	// revert: (messageId?: string, variantId?: string) => void = () => {}

	dispatchOnDeleteVariant(variant: Variant) {
		const onDeleteVariant = new CustomEvent("delete-variant", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					variant,
				},
			},
		})
		this.dispatchEvent(onDeleteVariant)
	}

	dispatchOnUpdateVariant(variant: Variant) {
		const onUpdateVariant = new CustomEvent("update-variant", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					variant,
				},
			},
		})
		this.dispatchEvent(onUpdateVariant)
	}

	//functions
	private _getLintReports = (): LintReport[] | undefined => {
		// wether a lint report belongs to a variant or message and when they are shown
		if (this.lintReports && this.lintReports.length > 0) {
			if (
				(this.message?.selectors && this.message.selectors.length === 0) ||
				!this.message?.selectors
			) {
				// when there are no selectors the reports of the message and variant are shown on variant level
				return this.lintReports
			}
			if (
				this.message.selectors &&
				this.message.selectors.length > 0 &&
				this.lintReports.some((report) => report.variantId && report.variantId === this.variant?.id)
			) {
				// when selectors are present, only the reports of the variant are shown
				return this.lintReports.filter(
					(report) => report.variantId && report.variantId === this.variant?.id
				)
			}
		}
		return undefined
	}

	private _delete = () => {
		if (this.message && this.variant) {
			deleteVariant({
				message: this.message,
				variant: this.variant,
			})
			this.dispatchOnDeleteVariant(this.variant)
			this.triggerMessageBundleRefresh()
		}
	}

	private _updateMatch = (matchIndex: number, value: string) => {
		//TODO improve this function
		if (this.variant && this.message) {
			updateMatch({
				variant: this.variant,
				matchIndex: matchIndex,
				value,
			})
			const variantID = this.variant.id

			const changedVariant = this.message.variants.find((v) => v.id === variantID)
			if (changedVariant) {
				changedVariant.match[matchIndex] = value
			}

			this.dispatchOnUpdateVariant(this.variant)
			this.triggerMessageBundleRefresh()
		}
	}

	// getter
	private get _selectors(): string[] | undefined {
		// @ts-ignore - just for prototyping
		return this.message ? this.message.selectors.map((selector) => selector.arg.name) : undefined
	}

	private get _matches(): string[] | undefined {
		// @ts-ignore - just for prototyping
		return this._selectors
			? this._selectors.map((_, index) => {
					return this.variant && this.variant.match[index]
			  })
			: undefined
	}

	//hooks
	override async firstUpdated() {
		await this.updateComplete

		// adds classes when dropdown is open, to keep it open when not hovering the variant
		const selectorConfigurator = this.shadowRoot?.querySelector("inlang-selector-configurator")
		const selectorDropdown = selectorConfigurator?.shadowRoot?.querySelector("sl-dropdown")
		if (selectorDropdown) {
			selectorDropdown.addEventListener("sl-show", (e) => {
				if (e.target === selectorDropdown) {
					//set parent class dropdown-open
					selectorConfigurator?.parentElement?.classList.add("dropdown-open")
				}
			})
			selectorDropdown.addEventListener("sl-hide", (e) => {
				if (e.target === selectorDropdown) {
					//remove parent class dropdown-open
					selectorConfigurator?.parentElement?.classList.remove("dropdown-open")
				}
			})
		}
	}

	// hooks
	override updated(changedProperties: any) {
		// works like useEffect
		// In order to not mutate object references, we need to clone the object
		// When the messageBundle prop changes, we update the internal state
		if (changedProperties.has("lintReports")) {
			// adds classes when dropdown is open, to keep it open when not hovering the variant
			const lintReportsTip = this.shadowRoot?.querySelector("inlang-lint-report-tip")
			const lintReportDropdown = lintReportsTip?.shadowRoot?.querySelector("sl-dropdown")
			if (lintReportDropdown) {
				const previousSibling = lintReportsTip?.previousSibling?.previousSibling?.previousSibling
				lintReportDropdown.addEventListener("sl-show", (e) => {
					if (e.target === lintReportDropdown) {
						//set parent class dropdown-open
						if (previousSibling instanceof HTMLElement) {
							previousSibling.classList.add("dropdown-open")
						}
					}
				})
				lintReportDropdown.addEventListener("sl-hide", (e) => {
					if (e.target === lintReportDropdown) {
						//remove parent class dropdown-open
						if (previousSibling instanceof HTMLElement) {
							previousSibling.classList.remove("dropdown-open")
						}
					}
				})
			}
		}
	}

	override render() {
		return !(!this.variant && this.message && this.message?.selectors.length > 0)
			? html`<div class="variant">
					${this.variant && this._matches
						? this._matches.map((match, index) => {
								return html`
									<sl-input
										id="${this.message!.id}-${this.variant!.id}-${match}"
										class="match"
										size="small"
										value=${match}
										@sl-blur=${(e: Event) => {
											const element = this.shadowRoot?.getElementById(
												`${this.message!.id}-${this.variant!.id}-${match}`
											)
											if (element && e.target === element) {
												this._updateMatch(index, (e.target as HTMLInputElement).value)
											}
										}}
									></sl-input>
								`
						  })
						: undefined}
					<slot name="pattern-editor"></slot>
					<div class="actions">
						<div class="dynamic-actions hide-dynamic-actions">
							<slot name="variant-action"></slot>
							${(this.message?.selectors.length === 0 && this.message?.variants.length <= 1) ||
							!this.message?.selectors
								? html`<inlang-selector-configurator
										.inputs=${this.inputs}
										.message=${this.message}
										.locale=${this.locale}
										.triggerMessageBundleRefresh=${this.triggerMessageBundleRefresh}
										.triggerSave=${this.triggerSave}
										.addMessage=${this.addMessage}
										.addInput=${this.addInput}
								  >
										<sl-tooltip content="Add Selector to message"
											><sl-button size="small" class="add-selector">
												<svg
													viewBox="0 0 24 24"
													width="18"
													height="18"
													slot="prefix"
													class="w-5 h-5 -mx-1"
													style="margin-right: -3px"
												>
													<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
												</svg>
												Selector
											</sl-button>
										</sl-tooltip>
								  </inlang-selector-configurator>`
								: ``}
							${(this.message && this.variant && this.message.selectors.length > 0) ||
							(this.message && this.variant && this.message.variants.length > 1)
								? html`<sl-tooltip content="Delete"
										><sl-button size="small" @click=${() => this._delete()}
											><svg
												xmlns="http://www.w3.org/2000/svg"
												width="18px"
												height="18px"
												viewBox="0 0 24 24"
												slot="prefix"
												style="margin-right: -2px; margin-left: -2px"
											>
												<g fill="none">
													<path
														d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
													/>
													<path
														fill="currentColor"
														d="M20 5a1 1 0 1 1 0 2h-1l-.003.071l-.933 13.071A2 2 0 0 1 16.069 22H7.93a2 2 0 0 1-1.995-1.858l-.933-13.07L5 7H4a1 1 0 0 1 0-2zm-3.003 2H7.003l.928 13h8.138zM14 2a1 1 0 1 1 0 2h-4a1 1 0 0 1 0-2z"
													/>
												</g></svg></sl-button
								  ></sl-tooltip>`
								: ``}
						</div>

						${this._getLintReports() && this._getLintReports()!.length > 0
							? html`<inlang-lint-report-tip
									.lintReports=${this._getLintReports()}
									.installedLintRules=${this.installedLintRules}
									.fixLint=${this.fixLint}
							  ></inlang-lint-report-tip>`
							: ``}
					</div>
			  </div> `
			: undefined
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-variant": InlangVariant
	}
}
