import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../../styling/base.js"
import "@shoelace-style/shoelace/dist/components/input/input.js"
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js"
import "@shoelace-style/shoelace/dist/components/button/button.js"
import "@shoelace-style/shoelace/dist/components/select/select.js"
import "@shoelace-style/shoelace/dist/components/option/option.js"
import "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.14.0/cdn/components/icon/icon.js"
import { Plugin } from "@inlang/plugin"
import { MessageLintRule } from "@inlang/message-lint-rule"
import { InlangModule } from "@inlang/module"
@customElement("lint-rule-level-object-input")
export class LintRuleLevelObjectInput extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.help-text {
				font-size: 0.8rem;
				color: var(--sl-input-help-text-color);
			}
			.container {
				display: flex;
				flex-direction: column;
				padding-bottom: 8px;
				gap: 12px;
			}
			.ruleId {
				font-size: 0.8rem;
				margin: 0;
			}
			.rule-container {
				display: flex;
				align-items: center;
				gap: 12px;
				flex-wrap: wrap;
			}
			.select {
				max-width: 120px;
				min-width: 100px;
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	modules?: object

	@property()
	value: Record<InlangModule["default"]["id"], string> = {}

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (
		value: Record<InlangModule["default"]["id"], string>,
		key: string,
		moduleId?: string
	) => void = () => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _valueOptions(): Array<Record<string, string>> | undefined {
		//@ts-ignore
		const valuesOptions = Object.values(this.schema.patternProperties)[0]?.anyOf
		return valuesOptions ? valuesOptions : undefined
	}

	handleUpdate(
		key: `plugin.${string}.${string}` | `messageLintRule.${string}.${string}`,
		value: string
	) {
		if (key && value) {
			if (!this.value) {
				this.value = {}
			}
			this.value[key] = value
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
		}
	}

	override render() {
		return html` <div>
			<p>${this.property}</p>
			${this._description && html`<p class="help-text">${this._description}</p>`}
			<div class="container">
				${this.modules &&
				Object.entries(this.modules).map(
					([key, module]: [string, Record<string, Record<string, string>>]) => {
						return key !== "internal" && key.split(".")[0] !== "plugin"
							? html`<div class="rule-container">
									<sl-select
										value=${this.value ? (this.value as any)[key] : "warning"}
										class="select"
										size="small"
										placeholder="warning"
										@sl-change=${(e: Event) => {
											this.handleUpdate(
												key as `plugin.${string}.${string}` | `messageLintRule.${string}.${string}`,
												(e.target as HTMLInputElement).value
											)
										}}
									>
										${this._valueOptions?.map((option) => {
											return html`<sl-option value=${option.const} class="add-item-side">
												${option.const}
											</sl-option>`
										})}
									</sl-select>
									<p class="ruleId">${(module.meta as Plugin | MessageLintRule | undefined)?.id}</p>
							  </div>`
							: undefined
					}
				)}
			</div>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"lint-rule-level-object-input": LintRuleLevelObjectInput
	}
}
