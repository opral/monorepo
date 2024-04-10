import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { InlangModule, type InstalledMessageLintRule, type InstalledPlugin } from "@inlang/sdk"
import "./../../field-header.js"

@customElement("lint-rule-level-object-input")
export class LintRuleLevelObjectInput extends LitElement {
	static override styles = [
		css`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.container {
				display: flex;
				flex-direction: column;
				padding-top: 8px;
				gap: 12px;
			}
			.ruleId {
				font-size: 0.8rem;
				margin: 0;
				color: var(--sl-input-color);
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
			.title-container {
				display: flex;
				gap: 8px;
			}
			sl-select::part(expand-icon) {
				color: var(--sl-input-placeholder-color);
			}
			sl-select::part(expand-icon):hover {
				color: var(--sl-input-color);
			}
			sl-select::part(base):hover {
				border: var(--sl-input-placeholder-color);
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	modules?: Array<InstalledMessageLintRule | InstalledPlugin>

	@property()
	value: Record<InlangModule["default"]["id"], string> = {}

	@property()
	schema: any = {}

	@property()
	required?: boolean = false

	@property()
	handleInlangProjectChange: (
		value: Record<InlangModule["default"]["id"], string>,
		key: string,
		moduleId?: string
	) => void = () => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _title(): string | undefined {
		return this.schema.title || undefined
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

	getValueOfLintRule = (
		id: InlangModule["default"]["id"],
		value: Record<InlangModule["default"]["id"], string>
	) => {
		//TODO: workaround because select field was not updating
		// setTimeout(() => {
		// 	const _value = this.value
		// 	this.value = {}
		// 	this.value = _value
		// })
		if (value && Object.keys(value).includes(id)) {
			return value[id]
		} else {
			return undefined
		}
	}

	override render() {
		return html` <div part="property" class="property">
			<div class="title-container">
				<field-header
					.fieldTitle=${this._title ? this._title : this.property}
					.description=${this._description}
					.optional=${this.required ? false : true}
					exportparts="property-title, property-paragraph"
				></field-header>
			</div>
			<div class="container">
				${this.modules &&
				this.modules.map((module) => {
					return module.id.split(".")[0] !== "plugin"
						? html`<div class="rule-container">
								<sl-select
									exportparts="listbox:option-wrapper"
									value="${this.getValueOfLintRule(module.id, this.value)}"
									class="select"
									size="small"
									placeholder="warning"
									@sl-change=${(e: Event) => {
										this.handleUpdate(
											module.id as `messageLintRule.${string}.${string}`,
											(e.target as HTMLInputElement).value
										)
									}}
								>
									${this._valueOptions?.map((option) => {
										return html`<sl-option
											exportparts="base:option"
											value=${option.const}
											class="add-item-side"
										>
											${option.const}
										</sl-option>`
									})}
								</sl-select>
								<p class="ruleId">${(module.displayName as { en: string }).en}</p>
						  </div>`
						: undefined
				})}
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
