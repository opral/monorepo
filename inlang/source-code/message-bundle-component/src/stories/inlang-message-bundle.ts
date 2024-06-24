import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import { type MessageBundle, type Message, type LanguageTag, createVariant } from "@inlang/sdk/v2" // Import the types
import { messageBundleStyling } from "./inlang-message-bundle.styles.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import { deleteSelector } from "../helper/crud/selector/delete.js"

import "./inlang-variant.js"
import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"
import "./inlang-add-input.js"

import SlTag from "@shoelace-style/shoelace/dist/components/tag/tag.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js"
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js"

import type { MessageLintReport, ProjectSettings } from "@inlang/sdk"
import { getInputs } from "../helper/crud/input/get.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-tag")) customElements.define("sl-tag", SlTag)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-menu")) customElements.define("sl-menu", SlMenu)
if (!customElements.get("sl-menu-item")) customElements.define("sl-menu-item", SlMenuItem)

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	static override styles = [baseStyling, messageBundleStyling]

	@property({ type: Object })
	messageBundle: MessageBundle | undefined

	@property({ type: Object })
	settings: ProjectSettings | undefined

	@property({ type: Array })
	lintReports: MessageLintReport[] | undefined

	dispatchOnSetSettings(messageBundle: MessageBundle) {
		const onChangeMessageBundle = new CustomEvent("change-message-bundle", {
			bubbles: true,
			detail: {
				argument: messageBundle,
			},
		})
		this.dispatchEvent(onChangeMessageBundle)
	}

	_triggerSave = () => {
		if (this.messageBundle) {
			this.dispatchOnSetSettings(this.messageBundle)
		}
	}

	_addMessage = (message: Message) => {
		if (this.messageBundle) {
			this.messageBundle.messages.push(message)
			this.requestUpdate()
		}
	}

	_triggerRefresh = () => {
		this.requestUpdate()
	}

	override async firstUpdated() {
		await this.updateComplete
		// override primitive colors to match the design system
		overridePrimitiveColors()
	}

	private _refLocale = (): LanguageTag | undefined => {
		return this.settings?.sourceLanguageTag
	}

	private _locales = (): LanguageTag[] | undefined => {
		return this.settings?.languageTags
	}

	private _fakeInputs = (): string[] | undefined => {
		const _refLanguageTag = this._refLocale()
		return _refLanguageTag && this.messageBundle
			? getInputs({ messageBundle: this.messageBundle })
			: undefined
	}

	override render() {
		return html`
			<div class=${`header`}>
				<div class="header-left">
					<span># ${this.messageBundle?.id}</span>
					<span class="alias">@ ${this.messageBundle?.alias?.default}</span>
				</div>
				${this._fakeInputs() && this._fakeInputs()!.length > 0
					? html`<div class="inputs-wrapper">
							Inputs:
							<div class="inputs">
								${this._fakeInputs()?.map(
									(input) => html`<sl-tag variant="neutral" size="small">${input}</sl-tag>`
								)}
								<inlang-add-input>
									<sl-tooltip content="Add input to message bundle">
										<sl-tag variant="neutral" size="small" class="add-input-tag"
											><svg viewBox="0 0 24 24" width="18" height="18" style="margin: 0 -2px">
												<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path></svg
										></sl-tag>
									</sl-tooltip>
								</inlang-add-input>
							</div>
					  </div>`
					: html`<div class="inputs-wrapper">
							<inlang-add-input>
								<sl-tooltip content="Add input to message bundle">
									<sl-button class="add-input" variant="text" size="small">
										<svg
											viewBox="0 0 24 24"
											width="18"
											height="18"
											slot="prefix"
											style="margin-right: -2px"
										>
											<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
										</svg>
										Input
									</sl-button>
								</sl-tooltip>
							</inlang-add-input>
					  </div>`}
			</div>
			<div class="messages-container">
				${this._locales() &&
				this._locales()?.map((locale) => {
					const message = this.messageBundle?.messages.find((message) => message.locale === locale)

					return this._renderMessage(
						locale,
						message,
						this.lintReports?.filter((report) => report.languageTag === locale)
					)
				})}
			</div>
		`
	}

	private _renderMessage(
		locale: LanguageTag,
		message?: Message,
		messageLintReports?: MessageLintReport[]
	) {
		return html`
			<div class="message">
				<div class="language-container">
					<span>${locale}</span>
					${this._refLocale() === locale
						? html`<sl-tag size="small" variant="neutral">ref</sl-tag>`
						: ``}
				</div>
				<div class="message-body">
					${(message && message.selectors.length > 0) ||
					(message && message.variants.length > 1 && message.selectors.length === 0)
						? html`<div
								class=${`message-header` +
								` ` +
								(message.variants && message.variants.length === 0 ? `no-bottom-border` : ``)}
						  >
								<div class="selector-container">
									${message.selectors.map(
										(selector, index) => html`<sl-dropdown>
											<div class="selector" slot="trigger">
												${
													// @ts-ignore
													selector.arg.name
												}
											</div>
											<sl-menu>
												<sl-menu-item
													value="delete"
													@click=${() => {
														deleteSelector({ message, index })
														this._triggerSave()
														this._triggerRefresh()
													}}
													><svg
														xmlns="http://www.w3.org/2000/svg"
														width="18px"
														height="18px"
														viewBox="0 0 24 24"
														slot="prefix"
														style="margin-right: -4px; margin-left: 12px"
													>
														<g fill="none">
															<path
																d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
															/>
															<path
																fill="currentColor"
																d="M20 5a1 1 0 1 1 0 2h-1l-.003.071l-.933 13.071A2 2 0 0 1 16.069 22H7.93a2 2 0 0 1-1.995-1.858l-.933-13.07L5 7H4a1 1 0 0 1 0-2zm-3.003 2H7.003l.928 13h8.138zM14 2a1 1 0 1 1 0 2h-4a1 1 0 0 1 0-2z"
															/>
														</g></svg
													>Delete selector</sl-menu-item
												>
											</sl-menu>
										</sl-dropdown>`
									)}
									<div class="add-selector-container">
										<inlang-selector-configurator
											.inputs=${this._fakeInputs()}
											.message=${message}
											.locale=${locale}
											.triggerMessageBundleRefresh=${this._triggerRefresh}
											.addMessage=${this._addMessage}
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
												</div>
											</sl-tooltip>
										</inlang-selector-configurator>
									</div>
								</div>
								<div class="message-actions">
									${messageLintReports && messageLintReports.length > 0
										? html`<inlang-lint-report-tip
												.lintReports=${messageLintReports}
										  ></inlang-lint-report-tip>`
										: ``}
								</div>
						  </div>`
						: ``}
					<div class="variants-container">
						${message && message.variants && message.variants.length > 0
							? message.variants.map(
									(variant) =>
										html`<inlang-variant
											.variant=${variant}
											.message=${message}
											.inputs=${this._fakeInputs()}
											.triggerSave=${this._triggerSave}
											.triggerMessageBundleRefresh=${this._triggerRefresh}
											.addMessage=${this._addMessage}
											.locale=${locale}
											.lintReports=${messageLintReports}
										></inlang-variant>`
							  )
							: message?.selectors.length === 0 || !message
							? html`<inlang-variant
									.message=${message}
									.inputs=${this._fakeInputs()}
									.triggerSave=${this._triggerSave}
									.addMessage=${this._addMessage}
									.triggerMessageBundleRefresh=${this._triggerRefresh}
									.locale=${locale}
									.lintReports=${messageLintReports}
							  ></inlang-variant>`
							: ``}
						${message?.selectors && message.selectors.length > 0
							? html`<p
									@click=${() => {
										upsertVariant({
											message: message,
											variant: createVariant({
												// combine the matches that are already present with the new category -> like a matrix
												match: message.selectors.map(() => "null"),
											}),
										})
										this._triggerSave()
										this._triggerRefresh()
									}}
									class="new-variant"
							  >
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										slot="prefix"
										class="w-5 h-5 -mx-1"
									>
										<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
									</svg>
									New variant
							  </p>`
							: ``}
					</div>
				</div>
			</div>
		`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-message-bundle": InlangMessageBundle
	}
}
