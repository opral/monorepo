import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import { type InlangProject, ProjectSettings } from "@inlang/sdk"

import "./input-fields/simple-input.js"

@customElement("inlang-settings")
export class InlangSettings extends LitElement {
	static override styles = baseStyling

	@property()
	inlangProject: InlangProject["settings"] | undefined = undefined

	private get _projectProperties() {
		return ProjectSettings.allOf[0].properties
	}

	override render() {
		//console.log(this.inlangProject)

		return this.inlangProject
			? html` <ul>
					${Object.entries(this.inlangProject).map(([key, value]) => {
						return this._projectProperties[key as keyof typeof this._projectProperties] &&
							key !== "$schema"
							? html`<li>
									<simple-input
										.property=${key}
										.value=${value}
										.schema=${this._projectProperties[key as keyof typeof this._projectProperties]}
									></simple-input>
							  </li>`
							: undefined
					})}
			  </ul>`
			: html`<div>No inlang project</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-settings": InlangSettings
	}
}
