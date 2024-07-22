import type { InstalledMessageLintRule, LanguageTag } from "@inlang/sdk"
import type { Declaration, LintReport, Message, ProjectSettings2, Variant } from "@inlang/sdk/v2"
import { createVariant } from "@inlang/sdk/v2"
import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import deleteSelector from "../helper/crud/selector/delete.js"
import upsertVariant from "../helper/crud/variant/upsert.js"

import "./inlang-variant.js"
import "./inlang-selector-configurator.js"

@customElement("inlang-message")
export default class InlangMessage extends LitElement {
	static override styles = [
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
			}
			:host {
				position: relative;
				display: flex;
				min-height: 44px;
				border: 1px solid var(--sl-input-border-color);
				border-top: none;
			}
			.message:first-child {
				border-top: 1px solid var(--sl-input-border-color);
			}
			.language-container {
				font-weight: 500;
				width: 80px;
				min-height: 44px;
				padding-top: 12px;
				padding-left: 12px;
				padding-right: 12px;
				background-color: var(--sl-input-background-color-disabled);
				border-right: 1px solid var(--sl-input-border-color);
				color: var(--sl-input-color);
			}
			.message-body {
				flex: 1;
				display: flex;
				flex-direction: column;
			}
			.message-header {
				width: 100%;
				min-height: 44px;
				display: flex;
				justify-content: space-between;
				background-color: var(--sl-input-background-color-disabled);
				color: var(--sl-input-color);
				border-bottom: 1px solid var(--sl-input-border-color);
			}
			.no-bottom-border {
				border-bottom: none;
			}
			.selector-container {
				min-height: 44px;
				display: flex;
			}
			.selector {
				height: 44px;
				width: 120px;
				display: flex;
				align-items: center;
				padding: 12px;
				border-right: 1px solid var(--sl-input-border-color);
				font-weight: 500;
				cursor: pointer;
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
			.selector:hover {
				background-color: var(--sl-input-background-color-hover);
			}
			.add-selector-container {
				height: 44px;
				width: 44px;
				display: flex;
				align-items: center;
				padding: 12px;
			}
			.add-selector::part(base) {
				height: 28px;
				width: 28px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
			}
			.message-actions {
				height: 44px;
				display: flex;
				align-items: center;
				padding: 12px;
				gap: 8px;
			}
			sl-button::part(base) {
				background-color: var(--sl-input-background-color);
				color: var(--sl-input-color);
				border: 1px solid var(--sl-input-border-color);
			}
			sl-button::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
			.variants-container {
				width: 100%;
				height: 44px;
				display: flex;
				flex-direction: column;
				height: auto;
			}
			.new-variant {
				box-sizing: border-box;
				min-height: 44px;
				width: 100%;
				display: flex;
				gap: 4px;
				align-items: center;
				padding-left: 12px;
				margin: 0;
				background-color: var(--sl-input-background-color);
				color: var(--sl-input-placeholder-color);
				border-top: 1px solid var(--sl-input-border-color);
				cursor: pointer;
				transitions: all 0.5s;
			}
			.new-variant:hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
			}
			.ref-tag::part(base) {
				background-color: var(--sl-input-placeholder-color);
				color: var(--sl-input-background-color);
				height: 22px;
				border: none;
			}
		`,
	]

	@property()
	locale: LanguageTag | undefined

	@property()
	message: Message | undefined

	@property()
	lintReports: LintReport[] | undefined

	@property()
	installedLintRules: InstalledMessageLintRule[] | undefined

	@property({ type: Object })
	settings: ProjectSettings2 | undefined

	@property({ type: Array })
	inputs: Declaration[] | undefined

	@property({ type: Array })
	freshlyAddedVariants: string[] = []

	@property()
	addInput: (name: string) => void = () => {}

	@property()
	addMessage: (message: Message) => void = () => {}

	@property()
	resetFreshlyAddedVariants: (newArray: string[]) => void = () => {}

	@property()
	triggerMessageBundleRefresh: () => void = () => {}

	@property()
	fixLint: (lintReport: LintReport, fix: LintReport["fixes"][0]["title"]) => void = () => {}

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

	private _refLocale = (): LanguageTag | undefined => {
		return this.settings?.baseLocale
	}

	override render() {
		return html`
			<div class="language-container">
				<span>${this.locale}</span>
				${this._refLocale() === this.locale
					? html`<sl-tag class="ref-tag" size="small" variant="neutral">ref</sl-tag>`
					: ``}
			</div>
			<div class="message-body">
				${(this.message && this.message.selectors.length > 0) ||
				(this.message && this.message.variants.length > 1 && this.message.selectors.length === 0)
					? html`<div
							class=${`message-header` +
							` ` +
							(this.message.variants && this.message.variants.length === 0
								? `no-bottom-border`
								: ``)}
					  >
							<div class="selector-container">
								${this.message.selectors.map(
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
													deleteSelector({ message: this.message!, index })
													this.triggerMessageBundleRefresh()
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
										.inputs=${this.inputs}
										.message=${this.message}
										.locale=${this.locale}
										.triggerMessageBundleRefresh=${this.triggerMessageBundleRefresh}
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
												>
													<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
												</svg>
											</sl-button>
										</sl-tooltip>
									</inlang-selector-configurator>
								</div>
							</div>
							<div class="message-actions">
								${this.message
									? this.freshlyAddedVariants.some((id) =>
											this.message!.variants.map((variant) => variant.id).includes(id)
									  )
										? html`<sl-button
												class="message-actions-button"
												size="small"
												@click=${() => {
													const newArray = this.freshlyAddedVariants.filter(
														(id) =>
															!this.message!.variants.map((variant) => variant.id).includes(id)
													)
													this.resetFreshlyAddedVariants(newArray)
													this.requestUpdate()
													this.triggerMessageBundleRefresh()
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
										: ``
									: ``}
								${this.lintReports &&
								this.lintReports.length > 0 &&
								this.lintReports.some((report) => !report.variantId)
									? html`<inlang-lint-report-tip
											.lintReports=${this.lintReports.filter((report) => !report.variantId) ?? []}
											.installedLintRules=${this.installedLintRules}
											.fixLint=${this.fixLint}
									  ></inlang-lint-report-tip>`
									: ``}
							</div>
					  </div>`
					: ``}
				<div class="variants-container">
					<slot name="variant"></slot>
					${this.message?.selectors && this.message.selectors.length > 0
						? html`<p
								@click=${() => {
									const variant = createVariant({
										// combine the matches that are already present with the new category -> like a matrix
										match: this.message?.selectors.map(() => "null"),
									})
									this.freshlyAddedVariants.push(variant.id)
									upsertVariant({
										message: this.message!,
										variant: variant,
									})
									this.dispatchOnInsertVariant(variant)
									this.triggerMessageBundleRefresh()
								}}
								class="new-variant"
						  >
								<svg viewBox="0 0 24 24" width="18" height="18" slot="prefix" class="w-5 h-5 -mx-1">
									<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
								</svg>
								New variant
						  </p>`
						: ``}
				</div>
			</div>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-message": InlangMessage
	}
}
