import type { TemplateResult } from "lit"
import { html } from "lit"
import { openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { customElement, property } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"
import { browserAuth, getUser } from "@lix-js/client/src/browser-auth.ts"
import { registry } from "@inlang/marketplace-registry"
import { ProjectSettings, loadProject } from "@inlang/sdk"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import { tryCatch } from "@inlang/result"

@customElement("inlang-install")
export class InlangInstall extends TwLitElement {
	@property({ type: Boolean })
	manual: boolean = false

	@property({ type: String })
	step:
		| ""
		| "nomodule"
		| "noauth"
		| "norepo"
		| "noproject"
		| "install"
		| "error"
		| "success"
		| "abort" = ""

	@property({ type: String })
	jsonURL: string = ""

	@property({ type: Object })
	url: Record<string, string> = {}

	@property({ type: String })
	module: string | undefined = undefined

	@property({ type: Boolean })
	copied: boolean = false

	@property({ type: String })
	repoURL: string = ""

	@property({ type: Boolean })
	authorized: boolean = false

	@property({ type: Object })
	user: Record<string, string> = {}

	@property({ type: Boolean })
	loading: boolean = false

	// Defines the loading progress of the installation in percent
	@property({ type: Number })
	loadingProgress: number = 0

	@property()
	error: string | string[] = "You've encountered an unknown error. Please try again later."

	/* This function uses lix to inject the module into the inlang project */
	async install() {
		if (!this.url.project) {
			this.step = "error"
			this.error = "No project found"
		}

		const repo = await openRepository(`http://localhost:3001/git/${this.url.repo}`, {
			nodeishFs: createNodeishMemoryFs(),
		})

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

		// Looks if the module is already installed
		for (const pkg of project.modules) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const installedModules = pkg.includes(this.module!)
			if (installedModules) {
				this.step = "error"
				this.error = "Module is already installed"
			}
		}

		// If no modules where found in the project, create an empty array
		if (!project.modules) project.modules = []

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		project.modules.push(this.module!)

		this.loadingProgress = 70

		// Stringify the project
		const generatedProject = formatting(project)

		await repo.nodeishFs.writeFile(`.${this.url.project}/settings.json`, generatedProject)

		const inlangProject = await loadProject({
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			projectPath: this.url.project!,
			nodeishFs: repo.nodeishFs,
		})

		if (inlangProject.errors().length > 0) {
			console.error(inlangProject.errors())
			this.step = "error"
			// @ts-ignore
			this.error = inlangProject.errors()
		}

		this.loadingProgress = 90

		// Push the project to the repo
		await repo.add({
			filepath: `${this.url.project?.slice(1)}/settings.json`,
		})

		await repo.commit({
			message: "inlang/manage: install module",
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

		const inlangProjectAfter = await loadProject({
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			projectPath: this.url.project!,
			nodeishFs: repo.nodeishFs,
		})

		this.loadingProgress = 100

		if (inlangProjectAfter.errors().length > 0) {
			console.error(inlangProjectAfter.errors())
			this.step = "error"
			// @ts-ignore
			this.error = inlangProjectAfter.errors()
		} else this.step = "success"
	}

	/* This function checks if all necessary data is given to install into a project */
	override async connectedCallback() {
		super.connectedCallback()
		this.url = JSON.parse(this.jsonURL)

		// @ts-ignore
		if (this.url.module) this.module = registry.find((x) => x.id === this.url.module)?.module

		const auth = await getUser().catch(() => {
			this.authorized = false
		})
		if (auth) {
			this.authorized = true
			this.user = auth
		}

		this.loading = true

		if (!this.module) {
			this.step = "nomodule"
			this.loading = false
		} else if (!this.authorized) {
			this.step = "noauth"
			this.loading = false
		} else if (!this.url.repo) {
			this.step = "norepo"
			this.loading = false
		} else if (!this.url.project) {
			this.step = "noproject"
			this.loading = false
		} else {
			this.step = "install"
			this.loading = false
			this.install()
		}
	}

	listModules() {
		// @ts-ignore
		return registry.filter((product) => product.module)
	}

	/* This function generates the install link for the user based on a repo url */
	generateInstallLink() {
		const url = new URL(this.repoURL)
		return `/install?repo=${url.host}${url.pathname.split("/").slice(0, 3).join("/")}&module=${
			this.url.module
		}`
	}

	override render(): TemplateResult {
		return this.step === "nomodule"
			? html`<div class="flex flex-col gap-2">
					<h2 class="text-xl font-semibold">No module found</h2>
					</h2>
					<p class="text-slate-500 mb-8">
						Find available modules here, or search on inlang.com for more in-depth information. 
					</p>

					<!-- List of all modules -->
					<div class="flex flex-col gap-2 max-h-72 overflow-y-scroll">
						${this.listModules().map(
							(product) =>
								html`<div
									class="flex items-center gap-2 w-full h-14 bg-slate-200 rounded-md px-3 py-2"
								>
									<img
										class="w-8 h-8 rounded-md"
										src=${product.icon}
										${/* @ts-ignore */ ""}
										alt=${product.displayName.en}
									/>
									${/* @ts-ignore */ ""}
									<div class="flex-grow truncate">${product.displayName.en}</div>
									<button
										class="bg-slate-800 text-white text-sm text-center py-1.5 px-3 rounded-md font-medium hover:bg-slate-900 transition-colors"
										@click=${() => {
											this.module = product.id
											window.location.href = window.location.href + `&module=${product.id}`
										}}
									>
										Install
									</button>
								</div>`
						)}
					</div>
					<div class="flex items-center gap-2 text-slate-500 text-sm">
					<div class="h-[1px] w-full bg-slate-200 my-4"></div>
										Or
					<div class="h-[1px] w-full bg-slate-200 my-4"></div>
					</div>
					<a
						href="https://inlang.com"
						target="_blank"
						class="bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
					>
						Find a module
					</a>
			  </div>`
			: this.step === "noauth"
			? html`<div class="flex flex-col gap-2">
						<h2 class="text-xl font-semibold">Please authorize to continue</h2>
						<p class="text-slate-500 mb-8">
							We need your authorization to install modules in your repository.
						</p>
						<button
							class=${"bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors " +
							(!this.module ? "cursor-not-allowed" : "")}
							@click=${async () => {
								await browserAuth.login()
								window.location.reload()
							}}
						>
							Authorize inlang
						</button>
						<div class="h-[1px] w-full bg-slate-200 my-4"></div>
						<h2 class="text-xl font-semibold">Or install manually</h2>
						<p class="text-slate-500 mb-4">
							In case you don't want to authorize inlang to install modules in your repository, you
							can also install them manually.
						</p>
						<button
							class=${"bg-slate-200 text-slate-900 text-center py-2 rounded-md font-medium hover:bg-slate-300 transition-colors " +
							(!this.module ? "cursor-not-allowed" : "")}
							@click=${() => {
								if (this.module) this.manual = true
							}}
						>
							Manual Install Instructions
						</button>
					</div>
					${this.manual
						? html`<div class="fixed inset-0 z-10 bg-black/25 flex items-center justify-center px-4"
						@click=${() => {
							this.manual = false
						}}
						>
			<div class="max-w-lg w-full bg-slate-100 rounded-xl relative p-4"
			@click=${(e: Event) => {
				e.stopPropagation()
			}}
			>
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
									? html`<doc-icon class="cursor-pointer" size="1.4em" icon="ic:check"></doc-icon>`
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
						Paste the copied link into the *.inlang/settings.json file inside the modules
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
	  </div> `
						: ""}`
			: this.step === "norepo"
			? html`<div class="flex flex-col gap-2">
			<h2 class="text-xl font-semibold">Insert your repository link
			</h2>
					</h2>
					<p class="text-slate-500 mb-4">
					You can install modules into your repository
					by providing the repository URL above.
					</p>
			</div>`
			: this.step === "noproject"
			? html`<div class="flex flex-col gap-2">
			<h2 class="text-xl font-semibold">Select your project
			</h2>
					</h2>
					<p class="text-slate-500 mb-4">
					You can install modules into your project 
					by selecting the project above.
					</p>
			</div>`
			: this.step === "install"
			? html`<div class="flex flex-col gap-2">
			<h2 class="text-xl font-semibold flex items-center gap-2">
			Installing module
			</h2>
					</h2>
					<p class="text-slate-500 mb-12">
					Modules are getting installed into your repository...
					</p>
					<div class="flex items-start gap-2 w-full h-2 bg-slate-200 rounded-full mb-12">
					<div class="bg-[#098DAC] h-2 rounded-lg w-full transition-all"
					style="max-width: ${this.loadingProgress}%"
					></div>
					</div>
					<button 
					@click=${() => {
						this.step = "abort"
					}}
					class="bg-red-500/10 text-red-500 text-center py-2 rounded-md font-medium hover:bg-red-500/20 transition-colors">
					Cancel installation
					</button>
			</div>`
			: this.step === "error"
			? html`<div class="flex flex-col gap-2"><h2 class="text-xl font-semibold flex items-center gap-2">
			An error occured
			</h2>
					</h2>
					<div class="max-h-[256px] overflow-y-scroll">
					<p class="text-slate-500">
					${typeof this.error === "string" ? this.error : this.error.join("\n")}
					</p></div></div>`
			: this.step === "success"
			? html`<div class="flex flex-col gap-2"><h2 class="text-xl font-semibold flex items-center gap-2">
			Succesfully installed into your project: ${this.url.project}
			</h2>
					</h2>
					<p class="text-slate-500">
					Your module was succesfully installed.
					</p></div>`
			: this.step === "abort"
			? html`<div class="flex flex-col gap-2"><h2 class="text-xl font-semibold flex items-center gap-2">
			Installation aborted
			</h2>
					</h2>
					<p class="text-slate-500 mb-12">
					Your module installation was aborted.
					</p>
					<button
							class="bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
							@click=${() => {
								window.location.href = "/"
							}}
						>
							Back to inlang/manage
						</button>
					</div>`
			: html`<div class="flex flex-col gap-2">Loading...</div>`
	}
}
