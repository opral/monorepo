import type { TemplateResult } from "lit"
import { html } from "lit"
import { openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { customElement, property } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"
import { browserAuth, getUser } from "@lix-js/server"
import { registry } from "@inlang/marketplace-registry"
import { ProjectSettings } from "@inlang/sdk"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import { tryCatch } from "@inlang/result"
import { publicEnv } from "@inlang/env-variables"

@customElement("inlang-uninstall")
export class InlangInstall extends TwLitElement {
	@property({ type: Boolean })
	isProduction: boolean = !window.location.origin.includes("localhost")

	@property({ type: String })
	step: "" | "nooptin" | "noauth" | "uninstall" | "error" | "success" | "abort" = ""

	@property({ type: String })
	jsonURL: string = ""

	@property({ type: Object })
	user: Record<string, string> = {}

	@property({ type: Boolean })
	optin: boolean = false

	@property({ type: Object })
	url: Record<string, string> = {}

	@property({ type: String })
	module: string | undefined = undefined

	@property({ type: Boolean })
	authorized: boolean = false

	@property({ type: Number })
	loadingProgress: number = 0

	@property({ type: String })
	error: string | string[] = ""

	@property({ type: Boolean })
	loading: boolean = false

	/* This function uses lix to inject the module into the inlang project */
	async uninstall() {
		if (!this.url.project) {
			this.step = "error"
			this.error = "No project found"
		}

		const repo = await openRepository(
			`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/git/${this.url.repo}`,
			{
				nodeishFs: createNodeishMemoryFs(),
			}
		)

		if (!repo) {
			this.step = "error"
			this.error = "Repository not found"
		}

		this.loadingProgress = 10

		const meta = await repo.getMeta().catch((err: any) => {
			if (err.status === 401) this.step = "noauth"
			else {
				this.step = "error"
				this.error = err.message
			}
		})

		// @ts-ignore
		if (!meta?.permissions.push) {
			this.step = "error"
			this.error = "You don't have push permissions for this repository."
		}

		const result = await tryCatch(async () => {
			const inlangProjectString = (await repo.nodeishFs.readFile(
				`.${this.url.project}/settings.json`,
				{
					encoding: "utf-8",
				}
			)) as string

			return inlangProjectString
		})

		if (result.error) {
			this.step = "error"
			this.error = result.error.message
		}

		this.loadingProgress = 30

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const formatting = detectJsonFormatting(result.data!)

		const projectString = result.data

		const parseProject = tryCatch(() => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return JSON.parse(projectString!)
		})

		if (parseProject.error) {
			this.step = "error"
			this.error = parseProject.error.message
		}

		this.loadingProgress = 50

		const project = parseProject.data as ProjectSettings

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		project.modules = project.modules.filter((x) => !x.includes(this.module!))

		this.loadingProgress = 70

		// Stringify the project
		const generatedProject = formatting(project)

		await repo.nodeishFs.writeFile(`.${this.url.project}/settings.json`, generatedProject)

		this.loadingProgress = 90

		// Push the project to the repo
		await repo.add({
			filepath: `${this.url.project?.slice(1)}/settings.json`,
		})

		await repo.commit({
			message: "inlang/manage: uninstall module",
			author: {
				name: this.user.username,
				email: this.user.email,
			},
		})

		if (this.step === "abort" || this.step === "error") {
			return
		}

		const pushResult = await repo.push()

		// @ts-ignore
		if (pushResult.error?.data?.statusCode === 403) {
			this.step = "noauth"
			browserAuth.addPermissions()
		}

		this.loadingProgress = 100

		window.location.href = `/?repo=${this.url.repo}&project=${this.url.project}&uninstall=true`
	}

	/* This function checks if all necessary data is given to uninstall from a project */
	override async connectedCallback() {
		super.connectedCallback()
		this.url = JSON.parse(this.jsonURL)

		const auth = await getUser().catch(() => {
			this.authorized = false
		})
		if (auth) {
			this.authorized = true
			this.user = auth
		}

		// @ts-ignore
		if (this.url.module) this.module = registry.find((x) => x.id === this.url.module)?.module

		if (!this.optin) {
			this.step = "nooptin"
			this.loading = false
		} else {
			this.step = "uninstall"
			this.loading = false
			// this.install()
		}
	}

	override render(): TemplateResult {
		return html`<div class="w-full h-full flex flex-col items-start justify-center">
			${this.step === "nooptin"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">We need your consent</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-4">
							Uninstalling a module from your project can have unexpected consequences. Please
							confirm that you want to uninstall the module:
						</p>
						<div class="mx-auto w-full max-w-lg mb-8">
							<div
								class="p-6 w-full bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2"
							>
								<div>
									<div class="w-full flex items-center justify-between mb-4">
										<h2 class="font-semibold text-lg">
											${
												// @ts-ignore
												registry.find((x) => x.id === this.url.module)?.displayName.en
											}
										</h2>
									</div>
									<p class="text-slate-500 line-clamp-2 text-sm mb-4">
										${
											// @ts-ignore
											registry.find((x) => x.id === this.url.module)?.description.en
										}
									</p>
									<a
										target="_blank"
										href=${(this.isProduction ? `https://inlang.com` : "http://localhost:3000") +
										`/m/${
											// @ts-ignore
											registry.find((x) => x.id === this.url.module)?.uniqueID
										}`}
										class="text-[#098DAC] text-sm font-medium transition-colors hover:text-[#06b6d4]"
									>
										More information
										<doc-icon
											class="inline-block ml-0.5 translate-y-0.5"
											size="1em"
											icon="mdi:arrow-top-right"
										></doc-icon>
									</a>
								</div>
							</div>
						</div>
						<div class="flex gap-4">
							<button
								class="bg-slate-800 px-6 w-full text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
								@click=${() => {
									this.optin = true
									this.step = "uninstall"
									this.uninstall()
								}}
							>
								Confirm
							</button>
							<button
								class="bg-red-500/10 px-6 w-full text-red-500 text-center py-2 rounded-md font-medium hover:bg-red-500/20 transition-colors"
								@click=${() => {
									this.step = "abort"
								}}
							>
								Cancel
							</button>
						</div>
				  </div>`
				: this.step === "uninstall"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">Uninstalling module</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-4">
							Modules are getting removed from your repository...
						</p>
						<div class="flex items-start gap-2 w-full h-2 bg-slate-200 rounded-full mb-12">
							<div
								class="bg-[#098DAC] h-2 rounded-lg w-full transition-all"
								style="max-width: ${this.loadingProgress}%"
							></div>
						</div>
						<button
							@click=${() => {
								this.step = "abort"
							}}
							class="bg-red-500/10 text-red-500 text-center py-2 rounded-md font-medium hover:bg-red-500/20 transition-colors"
						>
							Cancel installation
						</button>
				  </div>`
				: this.step === "error"
				? html`<div class="flex flex-col gap-2 max-w-lg">
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">An error occured</h1>
						<div class="max-h-[256px] overflow-y-scroll">
							<p class="text-slate-500 mb-8 text-center">
								${typeof this.error === "string" ? this.error : this.error.join("\n")}
							</p>
						</div>
						<div class="flex gap-4">
							<button
								class="bg-slate-800 px-4 w-full text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
								@click=${() => {
									window.location.href =
										"/install" +
										(this.url.repo ? `?repo=${this.url.repo}` : "") +
										(this.url.project ? `&project=${this.url.project}` : "") +
										(this.url.module ? `&module=${this.url.module}` : "")
								}}
							>
								Retry
							</button>
						</div>
				  </div> `
				: // : this.step === "success"
				// ? html`<div class="flex flex-col gap-2 max-w-lg">
				// 		<h1 class="font-bold text-4xl text-slate-900 mb-4 text-center">
				// 			Succesfully uninstalled
				// 		</h1>
				// 		<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mb-8">
				// 			Your module was succesfully uninstalled from your project: ${this.url.project}
				// 		</p>
				// 		<div class="flex gap-4">
				// 			<a
				// 				class="bg-slate-800 px-6 w-full text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
				// 				href=${`/?repo=${
				// 					this.url.repo + (this.url.project ? `&project=${this.url.project}` : "")
				// 				}`}
				// 			>
				// 				To inlang Manage
				// 			</a>
				// 			<a
				// 				class="bg-slate-200 truncate px-6 w-full text-slate-900 text-center py-2 rounded-md font-medium hover:bg-slate-300 transition-colors"
				// 				href=${`https://inlang.com/editor/${this.url.repo}`}
				// 				target="_blank"
				// 			>
				// 				Go to Fink - Editor
				// 			</a>
				// 		</div>
				//   </div>`
				this.step === "abort"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">Deletion aborted</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-8">
							Your module deletion was aborted.
						</p>
						<button
							class="bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
							@click=${() => {
								window.location.href =
									"/" +
									(this.url.repo ? `?repo=${this.url.repo}` : "") +
									(this.url.project ? `&project=${this.url.project}` : "")
							}}
						>
							Go back
						</button>
				  </div>`
				: html`<div class="flex flex-col gap-0.5">
						<div class="mx-auto">
							<div class="h-12 w-12 animate-spin mb-4">
								<div
									class="h-full w-full bg-surface-50 border-[#0891b2] border-4 rounded-full"
								></div>
								<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-slate-50"></div>
							</div>
						</div>
				  </div>`}
		</div>`
	}
}
