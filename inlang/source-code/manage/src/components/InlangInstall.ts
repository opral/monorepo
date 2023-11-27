import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement"
// import { browserAuth } from "@lix-js/client"
import { registry } from "@inlang/marketplace-registry"

@customElement("inlang-install")
export class InlangInstall extends TwLitElement {
	@property({ type: Boolean })
	manual: boolean = true

	@property({ type: String })
	step: string = ""

	@property({ type: Object })
	url: Record<string, string> = {}

	// @property({ type: String })
	// url: string = ""

	override connectedCallback() {
		super.connectedCallback()
		console.log(this.url)
	}

	override render(): TemplateResult {
		return html`<div class="flex flex-col gap-4">
				<h2 class="text-xl font-semibold">Please authorize to continue</h2>
				<p class="text-slate-500 mb-4">
					We need your authorization to install modules in your repository.
				</p>
				<button
					class="bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
					@click=${() => {
						// browserAuth.login()
					}}
				>
					Install
				</button>
				<div class="h-[1px] w-full bg-slate-200 my-4"></div>
				<h2 class="text-xl font-semibold">Or install manually</h2>
				<p class="text-slate-500 mb-4">
					In case you don't want to authorize inlang to install modules in your repository, you can
					also install them manually.
				</p>
				<button
					class="bg-slate-200 text-slate-900 text-center py-2 rounded-md font-medium hover:bg-slate-300 transition-colors"
					@click=${() => {
						this.manual = true
					}}
				>
					Manual Install Instructions
				</button>
			</div>
			${this.manual
				? html`<div class="fixed inset-0 z-10 bg-black/10 flex items-center justify-center px-4">
						<div class="max-w-lg w-full h-96 bg-slate-100 rounded-xl relative p-4">
							<doc-icon
								class="absolute top-2 right-2 bg-slate-200 rounded-full p-1 cursor-pointer transition-colors hover:bg-slate-300"
								size="1.6em"
								icon="ic:round-close"
								@click=${() => {
									this.manual = false
								}}
							></doc-icon>
							<div class="w-full border border-slate-200 rounded-lg p-4">
								<h3 class="text-lg font-semibold mb-2 leading-none">Copy the module</h3>
								<p class="text-slate-500 mb-4">Copy the module you've selected:</p>
								<code>npm install @inlang ${this.query.path}</code>
							</div>
						</div>
				  </div>`
				: ""} `
	}
}
