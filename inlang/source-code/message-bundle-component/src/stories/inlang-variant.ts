import {
	type Variant,
	type Message,
	createMessage,
	createVariant,
	type LanguageTag,
	type LintReport,
} from "@inlang/sdk/v2"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import deleteVariant from "../helper/crud/variant/delete.js"

import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"
import updateMatch from "../helper/crud/variant/updateMatch.js"
import variantIsCatchAll from "../helper/crud/variant/isCatchAll.js"

@customElement("inlang-variant")
export default class InlangVariant extends LitElement {
	static override styles = [
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
			}
			:host {
				border-top: 1px solid var(--sl-color-neutral-300);
			}
			:host(:first-child) {
				border-top: none;
			}
			.variant {
				position: relative;
				min-height: 44px;
				width: 100%;
				display: flex;
				align-items: center;
			}
			.match {
				height: 44px;
				width: 120px;
				background-color: none;
				border-right: 1px solid var(--sl-color-neutral-300);
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
				background-color: var(--sl-color-neutral-50);
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
			}
			.pattern::part(input) {
				min-height: 44px;
			}
			.pattern::part(input):hover {
				background-color: var(--sl-color-neutral-50);
			}
			.pattern::part(input)::placeholder {
				color: var(--sl-color-neutral-400);
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
				z-index: 3;
			}
			.add-selector {
				height: 30px;
				padding-right: 8px;
				padding-left: 6px;
				display: flex;
				gap: 4px;
				align-items: center;
				justify-content: center;
				color: var(--sl-color-neutral-600);
				border-radius: 4px;
				border: 1px solid var(--sl-color-neutral-300);
				background-color: var(--sl-color-neutral-0);
				cursor: pointer;
				font-size: 13px;
			}
			.add-selector:hover {
				color: var(--sl-color-neutral-900);
				background-color: var(--sl-color-neutral-200);
				border: 1px solid var(--sl-color-neutral-400);
			}
			sl-button::part(base):hover {
				color: var(--sl-color-neutral-900);
				background-color: var(--sl-color-neutral-100);
				border: 1px solid var(--sl-color-neutral-400);
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
		`,
	]

	@property()
	message: Message | undefined

	@property()
	locale: LanguageTag | undefined

	@property()
	variant: Variant | undefined

	@property()
	inputs: string[] | undefined

	@property()
	lintReports: LintReport[] | undefined

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

	@property()
	machineTranslate: (messageId?: string, variantId?: string) => void = () => {}

	@property()
	revert: (messageId?: string, variantId?: string) => void = () => {}

	@state()
	private _pattern: string | undefined = undefined

	private _getLintReports = (): LintReport[] | undefined => {
		if (this.lintReports && this.lintReports.length > 0) {
			if (
				(this.message?.selectors && this.message.selectors.length === 0) ||
				!this.message?.selectors
			) {
				return this.lintReports
			}
			if (
				this.message.selectors &&
				this.message.selectors.length > 0 &&
				this.lintReports.some((report) => report.variantId && report.variantId === this.variant?.id)
			) {
				return this.lintReports.filter(
					(report) => report.variantId && report.variantId === this.variant?.id
				)
			}
		}
		return undefined
	}

	private _getIsVariantEmpty = (): boolean => {
		if (!this._pattern) return true
		if (this._pattern === "") return true
		return false
	}

	private _isVariantMachineTranslatable = (): boolean => {
		if (!this.variant) return true
		if (this.variant.match && this.variant.match.length === 0) return true
		if (variantIsCatchAll({ variant: this.variant })) return true
		return false
	}

	_save = () => {
		if (this.message) {
			// upsert variant
			if (this.variant) {
				upsertVariant({
					message: this.message,
					variant: this._pattern
						? createVariant({
								id: this.variant.id,
								match: this.variant.match,
								text: this._pattern,
						  })
						: createVariant({
								id: this.variant.id,
								match: this.variant.match,
								text: undefined,
						  }),
				})
			} else {
				upsertVariant({
					message: this.message,
					variant: this._pattern
						? createVariant({
								text: this._pattern,
						  })
						: createVariant({
								text: undefined,
						  }),
				})
			}

			this.triggerSave()
		} else if (this.locale && this._pattern) {
			// new message
			//TODO: only text pattern supported
			this.addMessage(createMessage({ locale: this.locale, text: this._pattern }))
			this.triggerSave()
		}
	}

	_delete = () => {
		if (this.message && this.variant) {
			// upsert variant
			deleteVariant({
				message: this.message,
				variant: this.variant,
			})
			this.triggerSave()
			this.triggerMessageBundleRefresh()
		}
	}

	@state()
	private _isDelaying: boolean = false

	_delayedSave = () => {
		// if (this._isDelaying) return

		// this._isDelaying = true
		// setTimeout(() => {
		this._save()
		// 	this._isDelaying = false
		// }, 1000)
	}

	_updateMatch = (matchIndex: number, value: string) => {
		//TODO improve this function
		if (this.variant && this.message) {
			this._pattern =
				this.variant?.pattern
					.map((p) => {
						if ("value" in p) {
							return p.value
						} else if (p.type === "expression" && p.arg.type === "variable") {
							return p.arg.name
						}
						return ""
					})
					.join(" ") || ""
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

			this._save()
			this.triggerMessageBundleRefresh()
		}
	}

	private get _selectors(): string[] | undefined {
		// @ts-ignore - just for prototyping
		return this.message ? this.message.selectors.map((selector) => selector.arg.name) : undefined
	}

	private get _matches(): string[] | undefined {
		// @ts-ignore - just for prototyping
		return this._selectors.map((_, index) => {
			return this.variant && this.variant.match[index]
		})
	}

	override async firstUpdated() {
		await this.updateComplete

		//load _pattern
		this._pattern =
			this.variant?.pattern
				.map((p) => {
					if ("value" in p) {
						return p.value
					} else if (p.type === "expression" && p.arg.type === "variable") {
						return p.arg.name
					}
					return ""
				})
				.join(" ") || ""

		// override primitive colors to match the design system
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

	override render() {
		//get html of dropdown -> fix the folling line
		return html`<div class="variant">
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
			<sl-input
				class="pattern"
				size="small"
				placeholder="Enter pattern ..."
				value=${this.variant
					? this.variant.pattern
							.map((p) => {
								if ("value" in p) {
									return p.value
								} else if (p.type === "expression" && p.arg.type === "variable") {
									return p.arg.name
								}
								return ""
							})
							.join(" ")
					: ""}
				@input=${(e: Event) => {
					this._pattern = (e.target as HTMLInputElement).value
					this._delayedSave()
				}}
			></sl-input>
			<div class="actions">
				<div class="dynamic-actions hide-dynamic-actions">
					${this._getIsVariantEmpty() && this._isVariantMachineTranslatable()
						? html`<sl-button
								size="small"
								@click=${() => this.machineTranslate(this.message?.id, this.variant?.id)}
								>Machine Translate</sl-button
						  >`
						: ``}
					${(this.message?.selectors.length === 0 && this.message?.variants.length <= 1) ||
					!this.message?.selectors
						? html`<inlang-selector-configurator
								.inputs=${this.inputs}
								.message=${this.message}
								.locale=${this.locale}
								.triggerMessageBundleRefresh=${this.triggerMessageBundleRefresh}
								.addMessage=${this.addMessage}
								.addInput=${this.addInput}
						  >
								<sl-tooltip content="Add Selector to message"
									><div class="add-selector">
										<svg
											viewBox="0 0 24 24"
											width="18"
											height="18"
											slot="prefix"
											class="w-5 h-5 -mx-1"
										>
											<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
										</svg>
										Selector
									</div>
								</sl-tooltip>
						  </inlang-selector-configurator>`
						: ``}
					<sl-tooltip content="Revert"
						><sl-button size="small" @click=${() => this.revert(this.message?.id, this.variant?.id)}
							><svg
								xmlns="http://www.w3.org/2000/svg"
								width="16px"
								height="16px"
								slot="prefix"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="m5.828 7l2.536 2.535L6.95 10.95L2 6l4.95-4.95l1.414 1.415L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 0 0 0-12z"
								/></svg></sl-button
					></sl-tooltip>
					${this.message && this.variant
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
							.fixLint=${this.fixLint}
					  ></inlang-lint-report-tip>`
					: ``}
			</div>
		</div> `
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-variant": InlangVariant
	}
}
