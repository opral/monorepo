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

	@property({ type: String })
	jsonURL: string = ""

	@property({ type: Object })
	url: Record<string, string> = {}

	@property({ type: String })
	module: string | undefined = ""

	@property({ type: Boolean })
	copied: boolean = false

	override connectedCallback() {
		super.connectedCallback()
		this.url = JSON.parse(this.jsonURL)
		// @ts-ignore
		if (this.url.module) this.module = registry.find((x) => x.id === this.url.module)?.module
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
				? html`<div class="fixed inset-0 z-10 bg-black/25 flex items-center justify-center px-4">
						<div class="max-w-lg w-full bg-slate-100 rounded-xl relative p-4">
							<doc-icon
								class="absolute top-2 right-2 bg-slate-200 rounded-full p-1 cursor-pointer transition-colors hover:bg-slate-300"
								size="1.6em"
								icon="ic:round-close"
								@click=${() => {
									this.manual = false
								}}
							></doc-icon>
							<div class="w-full border border-slate-200 rounded-lg p-4 mb-4">
								<h3 class="text-lg font-semibold mb-2 leading-none">Copy the module</h3>
								<p class="text-slate-500 mb-4">Copy the module you've selected:</p>
								<div
									class="flex gap-4 md:items-center w-full flex-col-reverse md:flex-row overflow-x-auto md:pb-2 pb-6 p-2 rounded-md bg-slate-200"
								>
									<code class="text-sm py-2">${this.module}</code>
									<div
										class="flex items-center gap-2 flex-shrink-0 ml-auto"
										@click=${() => {
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
											navigator.clipboard.writeText(this.module!)
											this.copied = true
											setTimeout(() => {
												this.copied = false
											}, 1000)
										}}
									>
										${
											this.copied
												? html`<doc-icon
														class="cursor-pointer"
														size="1.4em"
														icon="ic:check"
												  ></doc-icon>`
												: html` <doc-icon
														class="cursor-pointer"
														size="1.4em"
														icon="ic:content-copy"
												  ></doc-icon>`
										}
									</div>
								</div>
							</div>
							<div class="w-full border border-slate-200 rounded-lg p-4 mb-8">
								<h3 class="text-lg font-semibold mb-2 leading-none">
									Paste the link into the project
								</h3>
								<p class="text-slate-500 mb-4">
									Paste the copied link into the project.inlang.json file inside the modules
									section:
								</p>
								<div
									class="flex md:gap-4 md:items-center w-full flex-col md:flex-row relative md:pb-2 p-2 rounded-md bg-slate-200"
								>
									<pre class=" overflow-x-auto">
									<code class="text-sm"
										>${`
{
	...
		"modules": [
			"${this.module}"
		],
	...
}
									`}</code
									>
									</pre>
									<div
										class="flex items-center gap-2 flex-shrink-0 absolute top-3 right-2"
										@click=${() => {
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
											navigator.clipboard.writeText(this.module!)
											this.copied = true
											setTimeout(() => {
												this.copied = false
											}, 1000)
										}}
									></div>
								</div>
							</div>
							<a
								href="https://inlang.com/g/49fn9ggo/guide-niklasbuchfink-howToSetupInlang"
								target="_blank"
								class="text-[#098DAC] font-medium transition-colors hover:text-[#06b6d4]"									"
							>
								You don't have project file? Read how to get started
								<doc-icon class="inline-block ml-1 translate-y-0.5" size="1.2em" icon="mdi:arrow-top-right"></doc-icon>
							</a>
						</div>
				  </div>`
				: ""} `
	}
}
