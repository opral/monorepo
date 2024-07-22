import { html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import {
	type MessageBundle,
	type Message,
	type Pattern,
	type LanguageTag,
	type LintReport,
	type ProjectSettings2,
	type Declaration,
	createVariant,
	createMessage,
	type Variant,
	type Expression,
} from "@inlang/sdk/v2"
import type { InstalledMessageLintRule } from "@inlang/sdk"

//internal components
import "./inlang-bundle-root.js"
import "./inlang-bundle-header.js"
import "./inlang-message.js"
import "./inlang-variant.js"
import "./pattern-editor/inlang-pattern-editor.js"
import "./actions/inlang-variant-action.js"

//shoelace components
import SlTag from "@shoelace-style/shoelace/dist/components/tag/tag.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js"
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js"
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-tag")) customElements.define("sl-tag", SlTag)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-menu")) customElements.define("sl-menu", SlMenu)
if (!customElements.get("sl-menu-item")) customElements.define("sl-menu-item", SlMenuItem)
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption)

//helpers
import getInputs from "../helper/crud/input/get.js"
import createInput from "../helper/crud/input/create.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import patternToString from "../helper/crud/pattern/patternToString.js"
import stringToPattern from "../helper/crud/pattern/stringToPattern.js"
import sortAllVariants from "../helper/crud/variant/sortAll.js"
import InlangBundleAction from "./actions/inlang-bundle-action.js"
import deleteInput from "../helper/crud/input/delete.js"
import deleteSelector from "../helper/crud/selector/delete.js"
import addSelector from "../helper/crud/selector/add.js"
import deleteVariant from "../helper/crud/variant/delete.js"
import updateMatch from "../helper/crud/variant/updateMatch.js"

@customElement("inlang-bundle")
export default class InlangBundle extends LitElement {
	//props
	@property({ type: Object })
	bundle: MessageBundle | undefined

	@property({ type: Object })
	settings: ProjectSettings2 | undefined

	@property({ type: Array })
	filteredLocales: LanguageTag[] | undefined

	@property({ type: Array })
	installedLintRules: InstalledMessageLintRule[] | undefined

	//disable shadow root -> because of contenteditable selection API
	override createRenderRoot() {
		return this
	}

	// events
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

	dispatchOnFixLint(lintReport: LintReport, fix: LintReport["fixes"][0]["title"]) {
		const onFixLint = new CustomEvent("fix-lint", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					lintReport,
					fix,
				},
			},
		})
		this.dispatchEvent(onFixLint)
	}

	dispatchOnMachineTranslate(messageId?: string, variantId?: string) {
		const onMachineTranslate = new CustomEvent("machine-translate", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					messageId,
					variantId,
				},
			},
		})
		this.dispatchEvent(onMachineTranslate)
	}

	// internal variables/states
	@state()
	private _bundle: MessageBundle | undefined

	@state()
	private _freshlyAddedVariants: string[] = []

	@state()
	private _bundleActions: Element[] = []

	//functions
	private _triggerSave = () => {
		if (this._bundle) {
			//this.dispatchOnChangeMessageBundle(this._bundle)
		}
	}

	private _addMessage = (message: Message) => {
		if (this._bundle) {
			this._bundle.messages.push(message)
		}
		this._triggerSave()
		this._triggerRefresh()
	}

	private _addInput = (name: string) => {
		if (this._bundle) {
			createInput({ messageBundle: this._bundle, inputName: name })
		}
		for (const message of this._bundle?.messages || []) {
			this.dispatchOnUpdateMessage(message, [])
		}
		this.requestUpdate()
	}

	private _triggerRefresh = () => {
		this.requestUpdate()
	}

	private _resetFreshlyAddedVariants = (newArray: string[]) => {
		this._freshlyAddedVariants = newArray
	}

	private _fixLint = (lintReport: LintReport, fix: LintReport["fixes"][0]["title"]) => {
		this.dispatchOnFixLint(lintReport, fix)
	}

	private _refLocale = (): LanguageTag | undefined => {
		return this.settings?.baseLocale
	}

	private _filteredLocales = (): LanguageTag[] | undefined => {
		if (!this.filteredLocales) return this.settings?.locales
		if (this.filteredLocales && this.filteredLocales.length === 0) return this.filteredLocales
		return this.filteredLocales
	}

	private _locales = (): LanguageTag[] | undefined => {
		return this._filteredLocales() || undefined
	}

	private _inputs = (): Declaration[] | undefined => {
		const _refLanguageTag = this._refLocale()
		return _refLanguageTag && this._bundle ? getInputs({ messageBundle: this._bundle }) : undefined
	}

	private _getBundleActions = (): Element[] => {
		return Array.from(this.children)
			.filter((child) => child instanceof InlangBundleAction)
			.map((child) => {
				child.setAttribute("slot", "bundle-action")
				const style = document.createElement("style")
				style.textContent = `
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
                `
				child.shadowRoot?.appendChild(style)
				return child
			})
	}

	// fill message with empty message if message is undefined to fix layout shift (will not be committed)
	private _fillMessage = (message: Message | undefined, locale: LanguageTag): Message => {
		if (message) {
			if (message.variants.length === 0) {
				message.variants.push(createVariant({ match: [] }))
			}
			return message
		} else {
			return createMessage({ locale: locale, text: "" })
		}
	}

	private _handleUpdatePattern = (
		message: Message | undefined,
		variant: Variant | undefined,
		newPattern: Pattern,
		locale: LanguageTag
	) => {
		if (variant) {
			if (!message) {
				throw new Error("a variant cant exist without a message")
			}

			// update existing variant
			const newVariant = { ...variant, pattern: newPattern }
			const upsertedVariant = upsertVariant({
				message: message!,
				variant: newVariant,
			})
			if (upsertedVariant) {
				this.dispatchOnUpdateVariant(upsertedVariant)
			}
		} else {
			const newVariant = {
				...createVariant({ match: [] }),
				pattern: newPattern,
			}

			if (message) {
				// A message object exists -> just add the new variant
				upsertVariant({
					message: message!,
					variant: newVariant,
				})
				this.dispatchOnInsertVariant(newVariant)
			} else {
				// A message object does not exist yet -> create one that also contains the new variant
				const newMessage = {
					...createMessage({ locale: locale, text: "test" }),
					selectors: [],
					declarations: [],
					locale: locale,
					variants: [newVariant],
				}
				this._addMessage(newMessage)
				this.dispatchOnInsertMessage(newMessage, [newVariant])
				this.dispatchOnInsertVariant(newVariant)
			}
		}
		this.requestUpdate()
	}

	// hooks
	override updated(changedProperties: any) {
		// works like useEffect
		// In order to not mutate object references, we need to clone the object
		// When the messageBundle prop changes, we update the internal state
		if (changedProperties.has("bundle")) {
			this._bundle = structuredClone(this.bundle)
			this._bundleActions = this._getBundleActions()
		}
	}

	override connectedCallback() {
		super.connectedCallback()
		this._bundle = structuredClone(this.bundle)
	}

	override async firstUpdated() {
		await this.updateComplete
		// override primitive colors to match the design system
		overridePrimitiveColors()
		this._bundle = structuredClone(this.bundle)
	}

	override render() {
		return html`
			<inlang-bundle-root>
				<inlang-bundle-header
					.bundle=${this._bundle}
					.settings=${this.settings}
					.addInput=${this._addInput}
					.triggerSave=${this._triggerSave}
					.triggerRefresh=${this._triggerRefresh}
					slot="bundle-header"
				>
					${this._bundleActions.map((action) => {
						return html`${action}`
					})}
				</inlang-bundle-header>
				<div class="messages-container" slot="messages">
					${this._locales() &&
					this._locales()?.map((locale) => {
						const message = this._bundle?.messages.find((message) => message.locale === locale)
						const lintReports = this._bundle?.lintReports?.reports.filter(
							(report) => report.messageId === message?.id
						)
						return html`<inlang-message
							.locale=${locale}
							.message=${message}
							.lintReports=${lintReports}
							.installedLintRules=${this.installedLintRules}
							.settings=${this.settings}
							.inputs=${this._inputs()}
							.freshlyAddedVariants=${this._freshlyAddedVariants}
							.addInput=${this._addInput}
							.addMessage=${this._addMessage}
							.resetFreshlyAddedVariants=${this._resetFreshlyAddedVariants}
							.triggerSave=${this._triggerSave}
							.triggerMessageBundleRefresh=${this._triggerRefresh}
							.fixLint=${this._fixLint}
						>
							${sortAllVariants({
								variants: this._fillMessage(structuredClone(message), locale).variants,
								ignoreVariantIds: this._freshlyAddedVariants,
							})?.map((fakevariant) => {
								const variant = message?.variants.find((v) => v.id === fakevariant.id)
								return html`<inlang-variant
									slot="variant"
									.variant=${variant}
									.message=${message}
									.inputs=${this._inputs()}
									.triggerSave=${this._triggerSave}
									.triggerMessageBundleRefresh=${this._triggerRefresh}
									.addMessage=${this._addMessage}
									.addInput=${this._addInput}
									.locale=${locale}
									.lintReports=${lintReports}
									.installedLintRules=${this.installedLintRules}
									.fixLint=${this._fixLint}
								>
									<inlang-pattern-editor
										id=${variant?.id}
										slot="pattern-editor"
										.pattern=${variant?.pattern}
										@change-pattern=${(event: { detail: { argument: Pattern } }) => {
											this._handleUpdatePattern(message, variant, event.detail.argument, locale)
										}}
									></inlang-pattern-editor>
									${patternToString({ pattern: variant?.pattern || [] }) === ""
										? html`<inlang-variant-action
												slot="variant-action"
												actionTitle="Machine Translate"
												tooltip="Machine Translate"
												@click=${() => {
													this.dispatchOnMachineTranslate(message?.id, variant?.id)
												}}
										  ></inlang-variant-action>`
										: ``}
								</inlang-variant>`
							})}
						</inlang-message>`
					})}
				</div>
			</inlang-bundle-root>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-bundle": InlangBundle
	}
}
