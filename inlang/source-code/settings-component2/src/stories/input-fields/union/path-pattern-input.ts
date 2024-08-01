import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "./../object/object-input.js"

@customElement("path-pattern-input")
export class PathPatternInput extends LitElement {
	static override styles = [
		css`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			sl-checkbox::part(base) {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
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
	required?: boolean = false

	@property()
	handleInlangProjectChange: (value: string, key: string, moduleId?: string) => void = () => {}

	private get _descriptionObject(): string | undefined {
		if (this.schema.description) {
			return this.schema.description
		} else {
			return "Specify the pathPattern to locate language files of specific namespaces in your repository. The namespace is a string taht shouldn't include '.', the path must include `{languageTag}` and end with `.json`."
		}
	}

	private get _examplesObject(): string[] | undefined {
		return [
			'{ common: "./locales/{languageTag}/common.json", app: "./locales/{languageTag}/app.json" }',
		]
	}

	private get _descriptionString(): string | undefined {
		if (this.schema.description) {
			return this.schema.description
		} else {
			return this.schema.anyOf[0].description || undefined
		}
	}

	private get _examplesString(): string[] | undefined {
		return this.schema.anyOf[0].examples
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
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.optional=${this.required ? false : true}
				exportparts="property-title"
			></field-header>
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
						<field-header
							.description=${this._descriptionObject}
							.examples=${this._examplesObject}
							.optional=${this.required ? false : true}
							exportparts="property-title, property-paragraph"
						></field-header>
						<object-input
							exportparts="button"
							.value=${typeof this.value === "object" ? this.value : ""}
							.keyPlaceholder=${"Namespace"}
							.valuePlaceholder=${"Path to resource [./**/*.json]"}
							.handleInlangProjectChange=${this.handleInlangProjectChange}
							.property=${this.property}
							.moduleId=${this.moduleId}
							.schema=${this.schema}
							.withTitle=${false}
							.withDescription=${false}
							.required=${this.required}
						>
						</object-input>
				  </div>`
				: html`<div part="property" class="property">
						<field-header
							.description=${this._descriptionString}
							.examples=${this._examplesString}
							.optional=${this.required ? false : true}
							exportparts="property-title, property-paragraph"
						></field-header>
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
