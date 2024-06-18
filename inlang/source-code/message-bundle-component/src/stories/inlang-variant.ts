import {
	type Variant,
	type Message,
	createMessage,
	createVariant,
	type LanguageTag,
} from "@inlang/sdk/v2"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import deleteVariant from "../helper/crud/variant/delete.js"
import { getNewVariantPosition } from "../helper/crud/variant/sort.js"
import type { MessageLintReport } from "@inlang/message-lint-rule"

import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"
import variantIsCatchAll from "../helper/crud/variant/isCatchAll.js"
import updateMatch from "../helper/crud/variant/updateMatch.js"

import SlTag from "@shoelace-style/shoelace/dist/components/tag/tag.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-tag")) customElements.define("sl-tag", SlTag)

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
			}
			.match::part(base) {
				border: none;
				border-radius: 0;
				min-height: 44px;
			}
			.match::part(input) {
				min-height: 44px;
			}
			.pattern {
				flex: 1;
				background-color: none;
				height: 44px;
			}
			.pattern::part(base) {
				border: none;
				border-radius: 0;
				min-height: 44px;
			}
			.pattern::part(input) {
				min-height: 44px;
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
				gap: 6px;
				padding-right: 12px;
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
			.hide-when-not-active {
				display: none;
				align-items: center;
				gap: 6px;
			}
			sl-button::part(base):hover {
				color: var(--sl-color-neutral-900);
				background-color: var(--sl-color-neutral-100);
				border: 1px solid var(--sl-color-neutral-400);
			}
			.variant:hover .hide-when-not-active {
				display: flex;
			}
		`,
	]

	@property()
	message: Message | undefined

	@property()
	languageTag: LanguageTag | undefined

	@property()
	variant: Variant | undefined

	@property()
	inputs: string[] | undefined

	@property()
	lintReports: MessageLintReport[] | undefined

	@property()
	addMessage: (newMessage: Message) => void = () => {}

	@property()
	triggerMessageBundleRefresh: () => void = () => {}

	@property()
	triggerSave: () => void = () => {}

	@state()
	private _pattern: string | undefined = undefined

	@state()
	private _isActive: boolean = false

	_save = () => {
		if (this.message && this.variant && this._pattern) {
			// upsert variant
			upsertVariant({
				message: this.message,
				variant: createVariant({
					match: this.variant.match,
					text: this._pattern,
				}),
			})
			this.triggerSave()
		} else {
			// new message
			if (this.languageTag && this._pattern) {
				//TODO: only text pattern supported
				this.addMessage(createMessage({ locale: this.languageTag, text: this._pattern }))
				this.triggerSave()
			}
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
			const variant = structuredClone(this.variant)
			//get index of this.varinat in message and delete it
			const deleteIndex = this.message.variants.indexOf(this.variant)
			this.message.variants.splice(deleteIndex, 1)

			//get sort index of new variant
			const newpos = getNewVariantPosition({
				variants: this.message.variants,
				newVariant: variant,
			})

			//insert variant at new position
			this.message.variants.splice(newpos, 0, variant)

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
		return this._selectors.map((selector) => {
			const matchIndex = this._selectors ? this._selectors.indexOf(selector) : undefined
			return this.variant && typeof matchIndex === "number" ? this.variant.match[matchIndex] : ""
		})
	}

	override render() {
		return html`<div class="variant">
			${this.variant && this._matches
				? this._matches.map(
						(match, index) =>
							html`
								<sl-input
									class="match"
									size="small"
									value=${match}
									@sl-blur=${(e: Event) => {
										this._updateMatch(index, (e.target as HTMLInputElement).value)
									}}
								></sl-input>
							`
				  )
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
				}}
				@sl-blur=${(e: Event) => {
					this._pattern = (e.target as HTMLInputElement).value
					this._save()
				}}
			></sl-input>
			<div class="actions">
				<div class="hide-when-not-active">
					<!-- <sl-button size="small" @click=${() => this._save()}>Save</sl-button> -->
					${this.message?.selectors.length === 0 || !this.message?.selectors
						? html`<inlang-selector-configurator
								.inputs=${this.inputs}
								.message=${this.message}
								.languageTag=${this.languageTag}
								.triggerMessageBundleRefresh=${this.triggerMessageBundleRefresh}
								.addMessage=${this.addMessage}
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
					${this.message && this.variant && !variantIsCatchAll({ variant: this.variant })
						? html`<sl-button size="small" @click=${() => this._delete()}>Delete</sl-button>`
						: ``}
				</div>
				${this.lintReports &&
				this.lintReports.length > 0 &&
				this.message?.selectors &&
				this.message.selectors.length === 0
					? html`<inlang-lint-report-tip .lintReports=${this.lintReports}></inlang-lint-report-tip>`
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
