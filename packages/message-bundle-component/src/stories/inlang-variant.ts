import { type Variant, type Message, createMessage, type LanguageTag } from "@inlang/sdk/v2"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import type { MessageLintReport } from "@inlang/message-lint-rule"

import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"

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
				padding: 12px;
				height: 44px;
				width: 80px;
				background-color: var(--sl-color-neutral-100);
				border-right: 1px solid var(--sl-color-neutral-300);
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
			.actions {
				position: absolute;
				top: 0;
				right: 0;
				height: 44px;
				display: flex;
				align-items: center;
				gap: 10px;
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
			sl-button::part(base):hover {
				color: var(--sl-color-neutral-900);
				background-color: var(--sl-color-neutral-100);
				border: 1px solid var(--sl-color-neutral-400);
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
	triggerSave: () => void = () => {}

	@state()
	private _pattern: string | undefined = undefined

	_save = () => {
		if (this.message && this.variant && this._pattern) {
			// upsert variant
			upsertVariant({
				message: this.message,
				variant: {
					match: this.variant.match,
					pattern: [
						{
							type: "text",
							value: this._pattern,
						},
					],
				},
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
		//console.log(this.message)
		return html`<div class="variant">
			${this.variant && this._matches
				? this._matches.map((match) => html`<div class="match">${match}</div>`)
				: undefined}
			<sl-input
				class="pattern"
				size="small"
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
			></sl-input>
			<div class="actions">
				<sl-button size="small" @click=${() => this._save()}>Save</sl-button>
				${this.message?.selectors && this.message.selectors.length === 0
					? html`<inlang-selector-configurator .inputs=${this.inputs} .message=${this.message}>
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
