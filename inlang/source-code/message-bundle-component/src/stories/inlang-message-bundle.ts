import { html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import {
	type MessageBundle,
	type Message,
	type LanguageTag,
	createVariant,
	type Variant,
} from "@inlang/sdk/v2" // Import the types
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
import { createInput } from "../helper/crud/input/create.js"
import sortAllVariants from "../helper/crud/variant/sortAll.js"

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

	_addInput = (name: string) => {
		if (this.messageBundle) {
			createInput({ messageBundle: this.messageBundle, inputName: name })
		}
		this._triggerSave()
		this._triggerRefresh()
	}

	_triggerRefresh = () => {
		this.requestUpdate()
	}

	@state()
	private _freshlyAddedVariants: string[] = []

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
				<div class="header-right">
					${this._fakeInputs() && this._fakeInputs()!.length > 0
						? html`<div class="inputs-wrapper">
								Inputs:
								<div class="inputs">
									${this._fakeInputs()?.map(
										(input) =>
											html`<sl-tag class="input-tag" variant="neutral" size="small"
												>${input}</sl-tag
											>`
									)}
									<inlang-add-input .addInput=${this._addInput}>
										<sl-tooltip content="Add input to message bundle">
											<sl-tag
												class="add-input-tag"
												variant="neutral"
												size="small"
												class="add-input-tag"
												><svg viewBox="0 0 24 24" width="18" height="18" style="margin: 0 -2px">
													<path
														fill="currentColor"
														d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
													></path></svg
											></sl-tag>
										</sl-tooltip>
									</inlang-add-input>
								</div>
						  </div>`
						: html`<div class="inputs-wrapper">
								<inlang-add-input .addInput=${this._addInput}>
									<sl-tooltip content="Add input to message bundle">
										<sl-button
											class="header-button"
											variant="text"
											size="small"
											class="add-input-tag"
											><svg
												viewBox="0 0 24 24"
												width="18"
												height="18"
												style="margin-right: -2px"
												slot="prefix"
											>
												<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path></svg
											>Input</sl-button
										>
									</sl-tooltip>
								</inlang-add-input>
						  </div>`}
					<div class="separator"></div>

					<sl-dropdown>
						<sl-button
							class="header-button"
							variant="text"
							size="small"
							class="add-input-tag"
							slot="trigger"
							><svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								slot="prefix"
							>
								<path
									fill="currentColor"
									d="M7 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
								/></svg
						></sl-button>
						<sl-menu>
							<sl-menu-item value="alias"
								><svg
									slot="prefix"
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									style="margin-right: -3px; margin-left: 12px; margin-top: -2px opacity: 0.7"
								>
									<path
										fill="currentColor"
										d="m16.828 1.416l5.755 5.755L7.755 22H2v-5.756zm0 8.681l2.927-2.926l-2.927-2.927l-2.926 2.927zm-4.34-1.512L4 17.074V20h2.926l8.488-8.488z"
									/></svg
								>Edit alias</sl-menu-item
							>
							<sl-menu-item value="alias"
								><svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									style="margin-right: -3px; margin-left: 12px; margin-top: -2px; opacity: 0.7"
									slot="prefix"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M11 17H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h4v2H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h4zm-3-4v-2h8v2zm5 4v-2h4q1.25 0 2.125-.875T20 12t-.875-2.125T17 9h-4V7h4q2.075 0 3.538 1.463T22 12t-1.463 3.538T17 17z"
									/></svg
								>Share link</sl-menu-item
							>
						</sl-menu>
					</sl-dropdown>
				</div>
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
						? html`<sl-tag class="ref-tag" size="small" variant="neutral">ref</sl-tag>`
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
											.addInput=${this._addInput}
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
									${this._freshlyAddedVariants.filter((id) =>
										message.variants.map((variant) => variant.id).includes(id)
									).length > 0
										? html`<sl-button
												class="message-actions-button"
												size="small"
												@click=${() => {
													this._freshlyAddedVariants = this._freshlyAddedVariants.filter(
														(id) => !message.variants.map((variant) => variant.id).includes(id)
													)
													this.requestUpdate()
												}}
												><svg
													slot="prefix"
													width="18"
													height="18"
													viewBox="0 0 20 20"
													style="margin-right: -2px; opacity: 0.7"
												>
													<g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">
														<path
															d="M10.293 7.707a1 1 0 0 1 0-1.414l3-3a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0"
														/>
														<path
															d="M17.707 7.707a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414"
														/>
														<path
															d="M14 5a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1m-4.293 7.293a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414l3-3a1 1 0 0 1 1.414 0"
														/>
														<path
															d="M2.293 12.293a1 1 0 0 1 1.414 0l3 3a1 1 0 1 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414"
														/>
														<path d="M6 15a1 1 0 0 1-1-1V6a1 1 0 1 1 2 0v8a1 1 0 0 1-1 1" />
													</g></svg
												>Sort</sl-button
										  >`
										: ``}
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
							? sortAllVariants({
									variants: message.variants,
									ignoreVariantIds: this._freshlyAddedVariants,
							  }).map((variant) => {
									return html`<inlang-variant
										.variant=${variant}
										.message=${message}
										.inputs=${this._fakeInputs()}
										.triggerSave=${this._triggerSave}
										.triggerMessageBundleRefresh=${this._triggerRefresh}
										.addMessage=${this._addMessage}
										.addInput=${this._addInput}
										.locale=${locale}
										.lintReports=${messageLintReports}
									></inlang-variant>`
							  })
							: message?.selectors.length === 0 || !message
							? html`<inlang-variant
									.message=${message}
									.inputs=${this._fakeInputs()}
									.triggerSave=${this._triggerSave}
									.addMessage=${this._addMessage}
									.addInput=${this._addInput}
									.triggerMessageBundleRefresh=${this._triggerRefresh}
									.locale=${locale}
									.lintReports=${messageLintReports}
							  ></inlang-variant>`
							: ``}
						${message?.selectors && message.selectors.length > 0
							? html`<p
									@click=${() => {
										const variant = createVariant({
											// combine the matches that are already present with the new category -> like a matrix
											match: message.selectors.map(() => "null"),
										})
										upsertVariant({
											message: message,
											variant: variant,
										})
										this._freshlyAddedVariants.push(variant.id)
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
