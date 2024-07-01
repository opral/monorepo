import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "../../field-header.js"
import { type InstalledLintRule, type InstalledPlugin, type LintConfig } from "@inlang/sdk/v2"

@customElement("lint-config-array-input")
export class LintConfigArrayInput extends LitElement {
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
				max-width: 140px;
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
			.level-icon {
				color: var(--sl-color-neutral-400);
				margin-top: 1px;
				margin-right: 6px;
			}
			.level-icon.danger {
				color: var(--sl-color-danger-600);
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	modules?: Array<InstalledLintRule | InstalledPlugin>

	@property()
	value: LintConfig[] | undefined

	@property()
	schema: any = {}

	@property()
	required?: boolean = false

	@property()
	handleInlangProjectChange: (value: Array<LintConfig>, key: string, moduleId?: string) => void =
		() => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _title(): string | undefined {
		return this.schema.title || undefined
	}

	private get _levelOptions() {
		return this.schema.items.properties["level"].anyOf.map((level: any) => level.const)
	}

	private _getConfigLevel(moduleId?: LintConfig["ruleId"]) {
		return this.value?.find((config) => config.ruleId === moduleId)?.level || "warning"
	}

	private _getDisplayName(displayName?: { en: string } | string) {
		if (typeof displayName === "string") {
			return displayName
		}
		return displayName?.en
	}

	handleUpdate(
		moduleId: `plugin.${string}.${string}` | `messageLintRule.${string}.${string}`,
		value: LintConfig["level"]
	) {
		if (moduleId && value) {
			console.log(this.value)
			if (!this.value) {
				this.value = []
			}

			const configIndex = this.value.findIndex((config) => {
				console.log("ruleId", config.ruleId, "moduleId", moduleId)
				return config.ruleId === (moduleId as LintConfig["ruleId"])
			})
			console.log(configIndex)
			if (configIndex !== -1 && this.value[configIndex]) {
				// Update the existing config's level
				this.value[configIndex]!.level = value
			} else {
				// Add a new config if it doesn't exist
				this.value.push({ ruleId: moduleId as LintConfig["ruleId"], level: value })
			}
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
		}
	}

	override render() {
		return this.modules && this.modules.some((module) => module.id.split(".")[0] !== "plugin")
			? html` <div part="property" class="property">
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
											id=${module.id}
											exportparts="listbox:option-wrapper"
											value=${this._getConfigLevel(module.id as LintConfig["ruleId"]) || "warning"}
											placeholder="warning"
											class="select"
											size="small"
											@sl-change=${(e: Event) => {
												this.handleUpdate(
													module.id as `messageLintRule.${string}.${string}`,
													(e.target as HTMLInputElement).value as LintConfig["level"]
												)
											}}
										>
											${this._getConfigLevel(module.id as LintConfig["ruleId"]) === "error"
												? html`<svg
														class="level-icon danger"
														slot="prefix"
														width="20"
														height="20"
														viewBox="0 0 24 24"
												  >
														<path
															fill="currentColor"
															d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
														/>
												  </svg>`
												: html`<svg
														class="level-icon"
														slot="prefix"
														width="20"
														height="20"
														viewBox="0 0 24 24"
												  >
														<path
															fill="currentColor"
															d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
														/>
												  </svg>`}
											${this._levelOptions?.map((option: string) => {
												return html`<sl-option
													exportparts="base:option"
													value=${option}
													class="add-item-side"
												>
													${option}
												</sl-option>`
											})}
										</sl-select>
										<p class="ruleId">${this._getDisplayName(module.displayName)}</p>
								  </div>`
								: undefined
						})}
					</div>
			  </div>`
			: undefined
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"lint-config-array-input": LintConfigArrayInput
	}
}
