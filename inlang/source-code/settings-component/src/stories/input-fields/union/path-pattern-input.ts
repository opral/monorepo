import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"
import "./../object/object-input.js"

@customElement("path-pattern-input")
export class PathPatternInput extends LitElement {
	static override styles = [
		//baseStyling,
		css`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			h3 {
				margin: 0;
				font-size: 14px;
				font-weight: 800;
			}
			.help-text {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
				margin: 0;
				line-height: 1.5;
			}
			sl-checkbox::part(base) {
				font-size: 14px;
			}
			.description-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	value: string | Record<string, string> = ""

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (value: string, key: string, moduleId?: string) => void = () => {}

	private get _descriptionObject(): string | undefined {
		if (this.schema.description) {
			return this.schema.description
		} else {
			return "Specify the pathPattern to locate language files of specific namespaces in your repository. The namespace is a string taht shouldn't include '.', the path must include `{languageTag}` and end with `.json`."
		}
	}

	private get _examplesObject(): string | undefined {
		return "Example: { common: './locales/{languageTag}/common.json', app: './locales/{languageTag}/app.json', ... }"
	}

	private get _descriptionString(): string | undefined {
		if (this.schema.description) {
			return this.schema.description
		} else {
			return this.schema.anyOf[0].description || undefined
		}
	}

	private get _examplesString(): string | undefined {
		return this.schema.anyOf[0].examples
			? "Example: " + JSON.stringify(this.schema.anyOf[0].examples)
			: undefined
	}

	private get _title(): string | undefined {
		return this.schema.title || undefined
	}

	@state()
	private _isObject: boolean | undefined = undefined

	@state()
	private _isInitialized: boolean = false

	override render() {
		if (this._isInitialized === false) {
			if (typeof this.value === "object") {
				this._isObject = true
			} else {
				this._isObject = false
			}
			this._isInitialized = true
		}
		return html` <div part="property" class="property">
			<h3 part="property-title">${this._title ? this._title : this.property}</h3>
			<sl-checkbox
				?checked=${this._isObject}
				@input=${(e: Event) => {
					//log input state
					if ((e.target as HTMLInputElement).checked) {
						this._isObject = true
					} else {
						this._isObject = false
					}
				}}
				>with namespaces</sl-checkbox
			>

			${this._isObject
				? html`<div part="property" class="property">
						${this._descriptionObject &&
						html`<p part="property-paragraph" class="help-text">${this._descriptionObject}</p>`}
						${this._examplesObject &&
						html`<p part="property-paragraph" class="help-text">${this._examplesObject}</p>`}
						<object-input
							.value=${typeof this.value === "object" ? this.value : ""}
							.keyPlaceholder=${"Namespace"}
							.valuePlaceholder=${"Path to resource [./**/*.json]"}
							.handleInlangProjectChange=${this.handleInlangProjectChange}
							.property=${this.property}
							.moduleId=${this.moduleId}
							.schema=${this.schema}
							.withTitle=${false}
							.withDescription=${false}
						>
						</object-input>
				  </div>`
				: html`<div part="property" class="property">
						${this._descriptionString &&
						html`<p part="property-paragraph" class="help-text">${this._descriptionString}</p>`}
						${this._examplesString &&
						html`<p part="property-paragraph" class="help-text">${this._examplesString}</p>`}
						<sl-input
							value=${typeof this.value === "object" ? "" : this.value}
							size="small"
							placeholder="Path to resource [./**/*.json]"
							@input=${(e: Event) => {
								this.handleInlangProjectChange(
									(e.target as HTMLInputElement).value,
									this.property,
									this.moduleId
								)
							}}
						>
						</sl-input>
				  </div>`}
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"path-pattern-input": PathPatternInput
	}
}
