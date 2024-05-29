import type { TemplateResult } from "lit"
import { html } from "lit"
import { getAuthClient, openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { customElement, property } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"
import { registry } from "@inlang/marketplace-registry"
import { ProjectSettings, loadProject, listProjects } from "@inlang/sdk"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import { tryCatch } from "@inlang/result"
import { publicEnv } from "@inlang/env-variables"
import { z } from "zod"

const browserAuth = getAuthClient({
	gitHubProxyBaseUrl: publicEnv.PUBLIC_GIT_PROXY_BASE_URL,
	githubAppName: publicEnv.PUBLIC_LIX_GITHUB_APP_NAME,
	githubAppClientId: publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
})

@customElement("inlang-install")
export class InlangInstall extends TwLitElement {
	@property({ type: Boolean })
	isProduction: boolean = !window.location.origin.includes("localhost")

	@property({ type: Boolean })
	manual: boolean = false

	@property({ type: String })
	step:
		| ""
		| "nomodule"
		| "noauth"
		| "norepo"
		| "noproject"
		| "nooptin"
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

	@property({ type: Boolean })
	optin: boolean = false

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

	@property({ type: Array })
	projects: Record<string, any>[] | undefined = undefined

	/* This function uses lix to inject the module into the inlang project */
	async install() {
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
			repo,
		})

		if (inlangProject.errors().length > 0) {
			console.error(inlangProject.errors())
			this.step = "error"
			// @ts-ignore
			this.error = inlangProject.errors()
		}

		this.loadingProgress = 90

		const filesWithUncommittedChanges = await repo.statusList({
			filter: (f: any) => f.endsWith(".json"),
		})

		await repo.commit({
			message: "inlang/manage: install module",
			author: {
				name: this.user.username,
				email: this.user.email,
			},
			include: filesWithUncommittedChanges.map((f) => f[0]),
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
			repo,
		})

		this.loadingProgress = 100

		if (inlangProjectAfter.errors().length > 0) {
			console.error(inlangProjectAfter.errors())
			this.step = "error"
			// @ts-ignore
			this.error = inlangProjectAfter.errors()
		} else window.location.href = `/?repo=${this.url.repo}&project=${this.url.project}&install=true`
	}

	/* This function checks if all necessary data is given to install into a project */
	override async connectedCallback() {
		super.connectedCallback()
		this.url = JSON.parse(this.jsonURL)

		// @ts-ignore
		if (this.url.module) this.module = registry.find((x) => x.id === this.url.module)?.module

		const auth = await browserAuth.getUser().catch(() => {
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

			this.projects = await listProjects(repo.nodeishFs, "/")

			this.step = "noproject"
			this.loading = false
		} else if (!this.optin) {
			this.step = "nooptin"
			this.loading = false
		} else {
			this.step = "install"
			this.loading = false
			this.install()
		}
	}

	listModules() {
		// @ts-ignore
		return registry.filter((product) => product.module) as Registry[]
	}

	/* This function generates the install link for the user based on a repo url */
	generateManageLink() {
		const url = new URL(this.repoURL)
		return `?repo=${url.host}${url.pathname.split("/").slice(0, 3).join("/")}`
	}

	/* This function generates the install link for the user based on a repo url */
	generateInstallLink() {
		const url = new URL(this.repoURL)
		return `/install?repo=${url.host}${url.pathname.split("/").slice(0, 3).join("/")}&module=${
			this.url.module
		}`
	}

	/* Checks if the GitHub Repo Link is valid */
	isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(this.repoURL).success

	override render(): TemplateResult {
		return html`<div class="w-full h-full flex flex-col items-start justify-center">
			${this.step === "nomodule"
				? html`<div class="max-w-lg w-full flex flex-col items-center gap-4">
						<h1 class="font-bold text-4xl text-slate-900 text-center">No module selected</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed mb-4 text-center">
							Please select a module to install, you can find one on inlang.com.
						</p>
						<a
							class="bg-slate-800 px-4 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
							href=${(this.isProduction ? `https://inlang.com/?` : "http://localhost:3000/?") +
							(this.url.repo ? `repo=${this.url.repo}` : "") +
							(this.url.project ? `&project=${this.url.project}` : "")}
						>
							Select module on inlang.com
						</a>
				  </div>`
				: this.step === "noauth"
				? html`<div class="flex flex-col gap-2 max-w-lg">
							<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">Authorize inlang</h1>
							<p
								class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-4"
							>
								We need your authorization to install modules in your repository and project.
							</p>
							<button
								class=${"bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors " +
								(!this.module ? "cursor-not-allowed" : "")}
								@click=${async () => {
									await browserAuth.login({
										redirect: window.location.origin + "/auth/auth-callback",
									})
									window.location.reload()
								}}
							>
								Authorize inlang
							</button>
							<div class="h-[1px] w-full bg-slate-200 my-4"></div>
							<h2 class="text-2xl font-semibold text-center">Or install manually</h2>
							<p class="text-slate-500 mb-4 text-center">
								In case you don't want to authorize inlang to install modules in your repository,
								you can also install them manually.
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
			<div class="max-w-xl w-full bg-slate-100 rounded-xl relative p-4"
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
					href=${(this.isProduction ? `https://inlang.com` : "http://localhost:3000") + "/c/apps"}
					target="_blank"
					class="text-[#098DAC] font-medium transition-colors hover:text-[#06b6d4]"									"
				>
					Visit product pages to learn how to get started.
					<doc-icon class="inline-block ml-1 translate-y-0.5" size="1.2em" icon="mdi:arrow-top-right"></doc-icon>
				</a>
			</div>
	  </div>`
							: ""} `
				: this.step === "norepo"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 text-center">Open your Repo</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed mb-4 text-center">
							To access your projects, please enter the URL of your GitHub repository.
						</p>
						<div
							disabled=${this.url.repo}
							class=${`px-1 gap-2 relative z-10 flex items-center w-full border bg-white rounded-lg transition-all relative ${
								this.url.repo ? "cursor-not-allowed" : ""
							} ${
								!this.isValidUrl() && this.repoURL.length > 0
									? " border-red-500 mb-8"
									: " focus-within:border-[#098DAC] border-slate-200"
							}
`}
						>
							<input
								id="repo-input"
								.value=${this.url.repo ? this.url.repo : this.repoURL}
								@input=${(e: InputEvent) => {
									this.repoURL = (e.target as HTMLInputElement).value
								}}
								@keydown=${(e: KeyboardEvent) => {
									if (e.key === "Enter" && this.isValidUrl()) {
										window.location.href =
											this.generateManageLink() +
											(this.url.project ? `&project=${this.url.project}` : "") +
											(this.url.module ? `&module=${this.url.module}` : "")
									}
								}}
								class=${"active:outline-0 px-2 focus:outline-0 focus:ring-0 border-0 h-12 grow placeholder:text-slate-500 placeholder:font-normal placeholder:text-base " +
								(this.url.repo ? "opacity-50 pointer-events-none " : " ") +
								(!this.isValidUrl() && this.repoURL.length > 0 ? "text-red-500" : "text-slate-900")}
								placeholder="https://github.com/user/example"
							/>
							<button
								@click="${() => {
									this.url.repo
										? (window.location.href = "/")
										: this.isValidUrl() &&
										  (window.location.href =
												this.generateManageLink() +
												(this.url.project ? `&project=${this.url.project}` : "") +
												(this.url.module ? `&module=${this.url.module}` : ""))
								}}"
								class="bg-white text-slate-600 border flex justify-center items-center h-10 relative rounded-md px-4 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
							>
								${this.url.repo ? "Edit" : "Confirm"}
							</button>
							${!this.isValidUrl() && this.repoURL.length > 0
								? html`<p class="absolute text-red-500 -bottom-5 text-xs">
										Please enter a valid GitHub repository URL.
								  </p>`
								: ""}
						</div>
				  </div>`
				: this.step === "noproject"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 mb-4 text-center">Select your project</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center">
							Please select the project you want to install to:
						</p>
						<div class="w-full relative max-w-sm">
							<div
								class="absolute pointer-events-none h-12 bg-gradient-to-b from-slate-50 to-transparent w-full top-0"
							></div>
							<div
								class="absolute pointer-events-none h-12 bg-gradient-to-t from-slate-50 to-transparent w-full bottom-0"
							></div>
							<div class="w-full flex flex-col gap-1 max-h-96 overflow-y-scroll py-12">
								${
									// @ts-ignore
									this.projects?.map(
										(project: Record<string, any>) =>
											html`<button
												@click=${() => {
													window.location.href =
														`/install?repo=${this.url.repo}&project=${project.projectPath}` +
														(this.url.module ? `&module=${this.url.module}` : "")
												}}
												class=${"flex gap-4 group items-center text-left p-2 text-md rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-600"}
											>
												${this.url.project === project.projectPath
													? html`<inlang-folder size="3rem"></inlang-logo>`
													: html`<inlang-folder size="3rem"></inlang-logo>`}
												${project.projectPath}
											</button>`
									)
								}
							</div>
						</div>
				  </div>`
				: this.step === "nooptin"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">We need your consent</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-4">
							Please confirm that you want to install the following module:
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
									this.step = "install"
									this.install()
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
				: this.step === "install"
				? html`<div class="flex flex-col gap-2">
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">Installing module</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-4">
							Modules are getting installed into your project...
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
								<button
									class="bg-slate-200 px-4 truncate w-full text-slate-900 text-center py-2 rounded-md font-medium hover:bg-slate-300 transition-colors"
									@click=${() => {
										this.manual = true
									}}
								>
									Manual instructions
								</button>
							</div>
						</div>
						${this.manual
							? html`<div class="fixed inset-0 z-10 bg-black/25 flex items-center justify-center px-4"
						@click=${() => {
							this.manual = false
						}}
						>
			<div class="max-w-xl w-full bg-slate-100 rounded-xl relative p-4"
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
				href=${(this.isProduction ? `https://inlang.com` : "http://localhost:3000") + "/c/apps"}
					target="_blank"
					class="text-[#098DAC] font-medium transition-colors hover:text-[#06b6d4]"									"
				>
					Go to the product pages to learn how to get started.
					<doc-icon class="inline-block ml-1 translate-y-0.5" size="1.2em" icon="mdi:arrow-top-right"></doc-icon>
				</a>
			</div>
	  </div>`
							: ""} `
				: // : this.step === "success"
				// ? html`<div class="flex flex-col gap-2 max-w-lg">
				// 		<h1 class="font-bold text-4xl text-slate-900 mb-4 text-center">
				// 			Succesfully installed
				// 		</h1>
				// 		<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mb-8">
				// 			Your module was succesfully installed into your project: ${this.url.project}
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
						<h1 class="font-bold text-4xl text-slate-900 mb-2 text-center">Installation aborted</h1>
						<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center mx-auto mb-8">
							Your module installation was aborted.
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
