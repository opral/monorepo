import { html, LitElement, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { baseStyling } from "../styling/base.js";
import { ProjectSettings } from "@inlang/sdk";
import checkRequired from "../helper/checkRequired.js";
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js";

import "./input-fields/general-input.js";

import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SLOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-select"))
  customElements.define("sl-select", SlSelect);
if (!customElements.get("sl-option"))
  customElements.define("sl-option", SLOption);
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput);
if (!customElements.get("sl-button"))
  customElements.define("sl-button", SlButton);
if (!customElements.get("sl-checkbox"))
  customElements.define("sl-checkbox", SlCheckbox);

type SchemaType = {
	meta?: any;
	schema?: {
		type: string;
		properties: Record<string, Record<string, unknown>>;
	};
};

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
				padding-top: 0.5rem;
				padding-bottom: 0.5rem;
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
				filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))
					drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
				font-weight: 600;
				line-height: 1.5;
				font-size: 14px;
			}
			.hover-bar-text {
				margin: 0;
			}
			.module-link-container {
				display: flex;
				color: var(--sl-input-help-text-color);
				gap: 6px;
				padding-top: 0.5rem;
			}
			.module-link {
				margin: 0;
				font-size: 14px;
				line-height: 1.5;
				flex-grow: 1;
				text-decoration: none;
				color: var(--sl-input-help-text-color);
			}
			.module-link:hover {
				color: var(--sl-color-primary-600);
			}
			.module-type {
				background-color: var(--sl-input-background-color-disabled);
				width: fit-content;
				padding: 0px 6px;
				border-radius: 2px;
				font-size: 14px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--sl-input-color-disabled);
				margin: 0;
				line-height: 1.5;
				flex-grow: 0;
			}
		`,
	];

	@property({ type: Object })
	settings: ProjectSettings = {} as ProjectSettings;

	@property({ type: Array })
	installedPlugins: Array<any> = [];

	dispatchOnSetSettings(settings: ProjectSettings) {
		const onSetSettings = new CustomEvent("set-settings", {
			detail: {
				argument: settings,
			},
		});
		this.dispatchEvent(onSetSettings);
	}

	@state()
	private _newSettings: ProjectSettings | undefined = undefined;

	@state()
	private _unsavedChanges: boolean = false;

	override async firstUpdated() {
		await this.updateComplete;

		if (this.settings) {
			this._newSettings = JSON.parse(JSON.stringify(this.settings));
		}

		//override primitive colors to match the design system
		overridePrimitiveColors();
	}

	handleInlangProjectChange = (
		//value needs to be exactly how it goes in the project settings json
		value: string,
		property: string,
		moduleId?: string
	) => {
		//update state object
		if (this._newSettings && moduleId) {
			this._newSettings = {
				...this._newSettings,
				// plugin: {
				// 	...this._newSettings.plugin
				// 	[moduleId]: {
				// 		...this._newSettings[moduleId],
				// 		[property]: value,
				// 	},
				// }
			};
		} else if (this._newSettings) {
			this._newSettings = {
				...this._newSettings,
				[property]: value,
			};
		}
		if (JSON.stringify(this.settings) !== JSON.stringify(this._newSettings)) {
			this._unsavedChanges = true;
		} else {
			this._unsavedChanges = false;
		}
	};

	_revertChanges = () => {
		if (this.settings) {
			this._newSettings = JSON.parse(JSON.stringify(this.settings));
		}
		this._unsavedChanges = false;
	};

	_saveChanges = () => {
		if (this._newSettings) {
			this.dispatchOnSetSettings(this._newSettings);
			this.settings = JSON.parse(JSON.stringify(this._newSettings));
		}
		this._unsavedChanges = false;
	};

	private get _settingProperties(): Record<
		string,
		{
			meta?: any;
			schema?: {
				type: string;
				properties: Record<string, Record<string, unknown>>;
			};
		}
	> {
		const _settings = this.settings;

		if (!_settings) throw new Error("No inlang settings");

		const generalSchema = { internal: { schema: ProjectSettings } };

		return generalSchema;
	}

	override render() {
		return html` <div class="container" part="base">
			${Object.entries(this._settingProperties).map(([key, value]) => {
				// TODO remove marketplace registry (bundling is too expensive)
				//const item = registry.find((item) => item.id === value.meta?.id)

				return value.schema?.properties && this._newSettings
					? html`<div class="module-container" part="module">
							${value.meta &&
							(value.meta?.displayName as { en: string }).en &&
							html`<div>
								<h2 part="module-title">
									${value.meta &&
									(value.meta?.displayName as { en: string }).en}
								</h2>
								<div class="module-link-container">
									<svg width="24" height="24" fill="none" viewBox="0 0 24 24">
										<path
											fill="currentColor"
											d="M11 17H7c-1.383 0-2.562-.488-3.537-1.463C2.488 14.562 2.001 13.383 2 12c0-1.383.487-2.562 1.463-3.537C4.439 7.488 5.618 7 7 7h4v2H7c-.833 0-1.542.292-2.125.875A2.893 2.893 0 004 12c0 .833.292 1.542.875 2.125A2.893 2.893 0 007 15h4v2zm-3-4v-2h8v2H8zm5 4v-2h4c.833 0 1.542-.292 2.125-.875A2.893 2.893 0 0020 12c0-.833-.292-1.542-.875-2.125A2.893 2.893 0 0017 9h-4V7h4c1.383 0 2.563.488 3.538 1.463.975.975 1.463 2.154 1.462 3.537 0 1.383-.488 2.562-1.463 3.538-.975.976-2.154 1.463-3.537 1.462h-4z"
										></path>
									</svg>
									<div class="module-type">
										${value.meta.id.startsWith("plugin")
											? "Plugin"
											: "Lint Rule"}
									</div>
								</div>
							</div>`}
							${Object.entries(value.schema.properties).map(
								([property, schema]) => {
									if (
										property === "$schema" ||
										property === "modules" ||
										property === "languageTags" ||
										property === "sourceLanguageTag"
									)
										return undefined;
									return key === "internal"
										? html`
												<general-input
													exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
													.property=${property}
													.modules=${[]}
													.value=${structuredClone(
														this._newSettings?.[
															property as keyof typeof this._newSettings
														]
													)}
													.schema=${schema}
													.handleInlangProjectChange=${this
														.handleInlangProjectChange}
													.required=${checkRequired(value.schema, property)}
												></general-input>
											`
										: html`
												<general-input
													exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
													.property=${property}
													.value=${structuredClone(
														// @ts-ignore
														this._newSettings?.[key]?.[property]
													)}
													.schema=${schema}
													.moduleId=${key}
													.handleInlangProjectChange=${this
														.handleInlangProjectChange}
													.required=${checkRequired(value.schema, property)}
												></general-input>
											`;
								}
							)}
						</div>`
					: undefined;
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
										this._revertChanges();
									}}
									varaint="default"
								>
									Cancel
								</sl-button>
								<sl-button
									size="small"
									@click=${() => {
										this._saveChanges();
									}}
									variant="primary"
								>
									Save Changes
								</sl-button>
							</div>
						</div>
					</div>`
				: html``}
		</div>`;
	}
}

// add types
declare global {
  interface HTMLElementTagNameMap {
    "inlang-settings": InlangSettings;
  }
}
