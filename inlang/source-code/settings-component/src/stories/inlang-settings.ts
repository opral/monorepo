import { html, LitElement, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import {
	type InlangModule,
	ProjectSettings,
	type InlangProject,
	type InstalledPlugin,
	type InstalledMessageLintRule,
} from "@inlang/sdk"
import checkOptional from "./../helper/checkOptional.js"
import overridePrimitiveColors from "./../helper/overridePrimitiveColors.js"

import "./input-fields/general-input.js"

import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SLOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SLOption)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-checkbox")) customElements.define("sl-checkbox", SlCheckbox)

@customElement("inlang-settings")
export default class InlangSettings extends LitElement {
	static override styles = [
		baseStyling,
		css`
			h2 {
				margin: 0;
				padding-top: 1rem;
			}
			.container {
				position: relative;
				display: flex;
				flex-direction: column;
				gap: 48px;
			}
			.module-container {
				display: flex;
				flex-direction: column;
				gap: 40px;
			}
			.hover-bar-container {
				width: 100%;
				box-sizing: border-box;
				position: sticky;
				bottom: 1rem;
			}
			.hover-bar {
				box-sizing: border-box;
				width: 100%;
				max-width: 500px;
				height: 48px;
				margin: 0 auto;
				display: flex;
				flex-wrap: wrap;
				justify-content: space-between;
				align-items: center;
				gap: 8px;
				background-color: var(--sl-panel-background-color);
				padding-left: 1rem;
				padding-right: 0.8rem;
				border-radius: 0.5rem;
				border: 1px solid var(--sl-panel-border-color);
				filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
			}
			.hover-bar-text {
				font-weight: 600;
				line-height: 1.5;
				font-size: 14px;
				margin: 0;
			}
			.test {
				width: 50px;
				height: 50px;
			}
		`,
	]

	@property({ type: Object })
	settings: ReturnType<InlangProject["settings"]> = {} as ReturnType<InlangProject["settings"]>

	@property({ type: Array })
	installedPlugins: ReturnType<InlangProject["installed"]["plugins"]> = [] as ReturnType<
		InlangProject["installed"]["plugins"]
	>

	@property({ type: Array })
	installedMessageLintRules: ReturnType<InlangProject["installed"]["messageLintRules"]> =
		[] as ReturnType<InlangProject["installed"]["messageLintRules"]>

	dispatchOnSetSettings(settings: ProjectSettings) {
		const onSetSettings = new CustomEvent("set-settings", {
			detail: {
				argument: settings,
			},
		})
		this.dispatchEvent(onSetSettings)
	}

	@state()
	private _newSettings: ProjectSettings | undefined = undefined

	@state()
	private _unsavedChanges: boolean = false

	override async firstUpdated() {
		await this.updateComplete

		if (this.settings) {
			this._newSettings = JSON.parse(JSON.stringify(this.settings))
		}

		//override primitive colors to match the design system
		overridePrimitiveColors()
	}

	handleInlangProjectChange = (
		//value needs to be exactly how it goes in the project settings json
		value: string,
		property: string,
		moduleId?: InlangModule["default"]["id"]
	) => {
		//update state object
		if (this._newSettings && moduleId) {
			this._newSettings = {
				...this._newSettings,
				[moduleId]: {
					...this._newSettings[moduleId],
					[property]: value,
				},
			}
		} else if (this._newSettings) {
			this._newSettings = {
				...this._newSettings,
				[property]: value,
			}
		}
		if (JSON.stringify(this.settings) !== JSON.stringify(this._newSettings)) {
			this._unsavedChanges = true
		} else {
			this._unsavedChanges = false
		}
	}

	_revertChanges = () => {
		if (this.settings) {
			this._newSettings = JSON.parse(JSON.stringify(this.settings))
		}
		this._unsavedChanges = false
	}

	_saveChanges = () => {
		if (this._newSettings) {
			this.dispatchOnSetSettings(this._newSettings)
			this.settings = JSON.parse(JSON.stringify(this._newSettings))
		}
		this._unsavedChanges = false
	}

	private get _settingProperties(): Record<
		InlangModule["default"]["id"] | "internal",
		{
			meta?: InstalledPlugin | InstalledMessageLintRule
			schema?: Record<string, Record<string, unknown>>
		}
	> {
		const _settings = this.settings
		const _installedPlugins = this.installedPlugins
		const _installedMessageLintRules = this.installedMessageLintRules

		if (!_settings) throw new Error("No inlang settings")
		if (!_installedPlugins) throw new Error("No installed plugins")

		const generalSchema: Record<
			InlangModule["default"]["id"] | "internal",
			{
				meta?: InstalledPlugin | InstalledMessageLintRule
				schema?: Record<string, Record<string, unknown>>
			}
		> = { internal: { schema: ProjectSettings.allOf[0] } }

		for (const plugin of _installedPlugins) {
			if (plugin.settingsSchema) {
				generalSchema[plugin.id] = {
					schema: plugin.settingsSchema,
					meta: plugin,
				}
			}
		}
		for (const lintRule of _installedMessageLintRules) {
			if (lintRule.settingsSchema) {
				generalSchema[lintRule.id] = {
					schema: lintRule.settingsSchema,
					meta: lintRule,
				}
			}
		}

		return generalSchema
	}

	override render() {
		return html` <div class="container" part="base">
			${Object.entries(this._settingProperties).map(([key, value]) => {
				return value.schema?.properties && this._newSettings
					? html`<div class="module-container" part="module">
							${value.meta &&
							(value.meta?.displayName as { en: string }).en &&
							html`<h2 part="module-title">
								${value.meta && (value.meta?.displayName as { en: string }).en}
							</h2>`}
							${Object.entries(value.schema.properties).map(([property, schema]) => {
								if (property === "$schema" || property === "modules" || property === "experimental")
									return undefined
								return key === "internal"
									? html`
											<general-input
												exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
												.property=${property}
												.modules=${this.installedMessageLintRules || []}
												.value=${structuredClone(
													this._newSettings?.[property as keyof typeof this._newSettings]
												)}
												.schema=${schema}
												.handleInlangProjectChange=${this.handleInlangProjectChange}
												.required=${checkOptional(value.schema, property)}
											></general-input>
									  `
									: html`
											<general-input
												exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
												.property=${property}
												.value=${
													// @ts-ignore
													structuredClone(this._newSettings?.[key]?.[property])
												}
												.schema=${schema}
												.moduleId=${key}
												.handleInlangProjectChange=${this.handleInlangProjectChange}
												.required=${checkOptional(value.schema, property)}
											></general-input>
									  `
							})}
					  </div>`
					: undefined
			})}
			${this._unsavedChanges
				? html`<div class="hover-bar-container">
						<div class="hover-bar" part="float">
							<p class="hover-bar-text">Attention, you have unsaved changes.</p>
							<div>
								<sl-button
									exportparts="base:button"
									size="small"
									@click=${() => {
										this._revertChanges()
									}}
									varaint="default"
								>
									Cancel
								</sl-button>
								<sl-button
									size="small"
									@click=${() => {
										this._saveChanges()
									}}
									variant="primary"
								>
									Save Changes
								</sl-button>
							</div>
						</div>
				  </div>`
				: html``}
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-settings": InlangSettings
	}
}

