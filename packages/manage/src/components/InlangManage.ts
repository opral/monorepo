import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"
import { z } from "zod"
import "./InlangUninstall"
import "./InlangInstall"
import { getAuthClient, createNodeishMemoryFs, openRepository } from "@lix-js/client"
import { listProjects, isValidLanguageTag } from "@inlang/sdk"
import { publicEnv } from "@inlang/env-variables"

import { tryCatch } from "@inlang/result"
import { registry } from "@inlang/marketplace-registry"
import type { MarketplaceManifest } from "../../../versioned-interfaces/marketplace-manifest/dist/interface.js"
import { posthog } from "posthog-js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"

const browserAuth = getAuthClient({
	gitHubProxyBaseUrl: publicEnv.PUBLIC_GIT_PROXY_BASE_URL,
	githubAppName: publicEnv.PUBLIC_LIX_GITHUB_APP_NAME,
	githubAppClientId: publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
})

type ManifestWithVersion = MarketplaceManifest & { version: string }

@customElement("inlang-manage")
export class InlangManage extends TwLitElement {
	@property({ type: Boolean })
	isProduction: boolean = !window.location.origin.includes("localhost")

	@property({ type: Object })
	url: Record<string, string | undefined> = {}

	@property({ type: String })
	repoURL: string = ""

	@property({ type: String })
	branches: string[] | undefined = undefined

	@property({ type: Object })
	projects: Record<string, string>[] | undefined | "no-access" | "not-found" | "load" | "error" =
		"load"

	@property({ type: String })
	languageTags:
		| {
				name: string
				sourceLanguageTag: boolean
				loading?: boolean
				selected?: boolean
		  }[]
		| undefined = undefined

	@property({ type: Object })
	modules: ManifestWithVersion[] | undefined | "empty"

	@property({ type: Object })
	user: Record<string, any> | undefined | "load" = "load"

	@property({ type: String })
	newLanguageTag: string = ""

	@property({ type: Boolean })
	newLanguageTagLoading: boolean = false

	@property()
	confirmPopup: undefined | "removeLanguageTag" | "addLanguageTag" = undefined

	@query("#language-tag-input")
	languageTagInput: HTMLInputElement | undefined

	@query("#repo-input")
	repoInput: HTMLInputElement | undefined

	@query("branch-dropdown")
	branchDropdown: NodeListOf<Element> | undefined

	@query("project-dropdown")
	projectDropdown: NodeListOf<Element> | undefined

	async projectHandler() {
		let repo: Repository
		try {
			repo = await openRepository(`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/git/${this.url.repo}`, {
				nodeishFs: createNodeishMemoryFs(),
				branch: this.url.branch ? this.url.branch : undefined,
			})
		} catch (e) {
			this.projects = "no-access"
			return
		}

		this.branches = await repo.getBranches()
		this.projects = await listProjects(repo.nodeishFs, "/")

		if (!this.url.project && this.url.path === "") {
			for (const project of this.projects) {
				if (project.projectPath === "/project.inlang") {
					this.url.project = project.projectPath
					window.history.pushState(
						{},
						"",
						`?repo=${this.url.repo}${this.url.branch ? `&branch=${this.url.branch}` : ""}&project=${
							this.url.project
						}`
					)
				}
			}
		}

		if (this.url.project) {
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
				if (result.error.toString().includes("ENOENT")) {
					this.projects = "not-found"
					return
				} else {
					this.projects = "no-access"
					return
				}
			}

			const inlangProject = JSON.parse(result.data)
			const modules = inlangProject.modules

			const tempModules = []
			for (const module of modules) {
				for (const registryModule of registry) {
					if (
						// @ts-ignore
						registryModule.module &&
						// @ts-ignore
						registryModule.module.includes(
							module.split("/")[5].includes("@")
								? module.split("/")[5].split("@")[0]
								: module.split("/")[5]
						)
					) {
						if (!module.includes("jsdelivr")) {
							this.projects = "error"
							return
						}

						const response = await fetch(
							// @ts-ignore
							registryModule.module.replace("dist/index.js", `package.json`)
						)

						tempModules.push({
							...registryModule,
							// @ts-ignore
							version: (await response.json()).version,
						})
					}
				}
			}

			// Remove duplicates
			for (const [index, module] of tempModules.entries()) {
				for (const [index2, module2] of tempModules.entries()) {
					if (module.id === module2.id && index !== index2) {
						tempModules.splice(index2, 1)
					}
				}
			}

			this.modules = tempModules
			if (!this.modules) this.modules = "empty"

			// Read the languageTags
			this.languageTags = inlangProject.languageTags.map((languageTag: string) => {
				return {
					name: languageTag,
					sourceLanguageTag: languageTag === inlangProject.sourceLanguageTag,
				}
			})
		}
	}

	/* This function generates the install link for the user based on a repo url */
	generateManageLink() {
		const url = new URL(this.repoURL)
		return `?repo=${url.host}${url.pathname.split("/").slice(0, 3).join("/")}`
	}

	/* Checks if the GitHub Repo Link is valid */
	isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(this.repoURL).success

	override async connectedCallback() {
		super.connectedCallback()

		/* Initialize Telemetry via Posthog */
		if (publicEnv.PUBLIC_POSTHOG_TOKEN) {
			posthog.init(publicEnv.PUBLIC_POSTHOG_TOKEN ?? "placeholder", {
				api_host:
					process.env.NODE_ENV === "production" ? "https://tm.inlang.com" : "http://localhost:4005",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
			})
		} else if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
			return console.warn("Posthog token is not set. Telemetry will not be initialized.")
		}

		if (window.location.search !== "" && window.location.pathname !== "") {
			const url = {
				path: window.location.pathname.replace("/", ""),
				...Object.fromEntries(
					window.location.search
						.slice(1)
						.split("&")
						.map((x) => x.split("="))
						.map(([key, value]) => [key, value])
				),
			}
			this.url = url
		} else {
			this.url = {
				path: window.location.pathname.replace("/", ""),
			}
		}

		this.url.repo && this.projectHandler()

		const user = await browserAuth.getUser().catch(() => {
			this.user = undefined
		})
		if (user) {
			this.user = user
		}
	}

	handleBranchesDropdown() {
		this.projectDropdown = this.shadowRoot?.querySelectorAll(".branch-dropdown")
		if (this.branchDropdown)
			// @ts-ignore
			for (const dropdown of this.branchDropdown) {
				dropdown.addEventListener("click", () => {
					dropdown.classList.toggle("active")
				})
			}
	}

	handleProjectDropdown() {
		this.projectDropdown = this.shadowRoot?.querySelectorAll(".project-dropdown")
		if (this.projectDropdown)
			// @ts-ignore
			for (const dropdown of this.projectDropdown) {
				dropdown.addEventListener("click", () => {
					dropdown.classList.toggle("active")
				})
			}
	}

	async removeLanguageTag(languageTag: string) {
		if (typeof this.user === "undefined" || this.user === "load") return

		this.languageTags = this.languageTags?.map((tag) => {
			if (tag.name === languageTag) {
				return {
					...tag,
					loading: true,
				}
			} else {
				return tag
			}
		})

		const repo = await openRepository(
			`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/git/${this.url.repo}`,
			{
				nodeishFs: createNodeishMemoryFs(),
				branch: this.url.branch ? this.url.branch : undefined,
			}
		)

		const inlangProjectString = (await repo.nodeishFs.readFile(
			`.${this.url.project}/settings.json`,
			{
				encoding: "utf-8",
			}
		)) as string

		const formatting = detectJsonFormatting(inlangProjectString)

		const inlangProject = JSON.parse(inlangProjectString)

		const languageTags = inlangProject.languageTags.filter((tag: string) => tag !== languageTag)

		inlangProject.languageTags = languageTags

		const generatedProject = formatting(inlangProject)

		await repo.nodeishFs.writeFile(`.${this.url.project}/settings.json`, generatedProject)

		const filesWithUncommittedChanges = await repo.statusList({
			filter: (f: any) => f.endsWith(".json"),
		})

		await repo.commit({
			message: "inlang/manage: remove languageTag " + languageTag,
			author: {
				name: this.user.username,
				email: this.user.email,
			},
			include: filesWithUncommittedChanges.map((f) => f[0]),
		})

		const result = await repo.push()

		// @ts-ignore
		if (result.error) console.error(result.error)

		this.languageTags = this.languageTags?.filter((tag) => tag.name !== languageTag)

		posthog.capture("MANAGE removed languageTag", {
			languageTag,
		})
	}

	async addLanguageTag() {
		if (this.newLanguageTag === "") return

		if (typeof this.user === "undefined" || this.user === "load") return

		this.newLanguageTagLoading = true

		const repo = await openRepository(
			`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/git/${this.url.repo}`,
			{
				nodeishFs: createNodeishMemoryFs(),
				branch: this.url.branch ? this.url.branch : undefined,
			}
		)

		const inlangProjectString = (await repo.nodeishFs.readFile(
			`.${this.url.project}/settings.json`,
			{
				encoding: "utf-8",
			}
		)) as string

		const formatting = detectJsonFormatting(inlangProjectString)

		const inlangProject = JSON.parse(inlangProjectString)

		const languageTags = inlangProject.languageTags

		languageTags.push(this.newLanguageTag)

		inlangProject.languageTags = languageTags

		const generatedProject = formatting(inlangProject)

		await repo.nodeishFs.writeFile(`.${this.url.project}/settings.json`, generatedProject)

		const filesWithUncommittedChanges = await repo.statusList({
			filter: (f: any) => f.endsWith(".json"),
		})

		await repo.commit({
			message: "inlang/manage: add languageTag " + this.newLanguageTag,
			author: {
				name: this.user.username,
				email: this.user.email,
			},
			include: filesWithUncommittedChanges.map((f) => f[0]),
		})

		const result = await repo.push()

		// @ts-ignore
		if (result.error) console.error(result.error)

		this.languageTags = [
			...this.languageTags!,
			{
				name: this.newLanguageTag,
				sourceLanguageTag: false,
			},
		]

		this.newLanguageTag = ""
		this.newLanguageTagLoading = false
	}

	override render(): TemplateResult {
		return html` <main
			class="w-full min-h-screen flex flex-col bg-slate-50"
			@click=${() => {
				this.shadowRoot?.querySelector("#branch")?.classList.add("hidden")
				this.shadowRoot?.querySelector("#account")?.classList.add("hidden")
				this.shadowRoot?.querySelector("#projects")?.classList.add("hidden")
			}}
		>
			<header class="bg-white border-b border-slate-200 py-3.5 px-4 sticky top-0 z-50">
				<div class="max-w-7xl mx-auto flex flex-row justify-between relative sm:static">
					<div class="flex items-center">
						<a
							href=${this.isProduction ? `https://inlang.com` : "http://localhost:3000"}
							target="_blank"
							class="flex items-center w-fit pointer-events-auto transition-opacity hover:opacity-75"
						>
							<inlang-logo size="2rem"></inlang-logo>
						</a>
						<p class="self-center text-left font-regular text-slate-400 pl-4 pr-1">/</p>
						<a
							href="/"
							class="self-center pl-2 text-left font-medium text-slate-900 truncate hover:text-[#0B91B2] transition-colors duration-150"
							>Manage</a
						>
					</div>
					<div class="flex items-center gap-4 flex-shrink-0">
						${this.user && this.user !== "load"
							? html`<div>
									<!-- Dropdown for account settings -->
									<div
										class="relative"
										x-data="{ open: false }"
										@click=${(e: Event) => {
											e.stopPropagation()
										}}
									>
										<button
											@click=${() => {
												this.shadowRoot?.querySelector("#branch")?.classList.add("hidden")
												this.shadowRoot?.querySelector("#projects")?.classList.add("hidden")
												this.shadowRoot?.querySelector("#account")?.classList.toggle("hidden")
											}}
											class="flex items-center gap-1 group"
										>
											<img
												class="h-6 w-6 rounded-full transition-opacity group-hover:opacity-70"
												src=${this.user.avatarUrl}
											/>
											<svg
												viewBox="0 0 24 24"
												width="1.2em"
												height="1.2em"
												class="text-slate-400 group-hover:text-slate-300 transition-colors"
											>
												<path
													fill="currentColor"
													d="M12 14.95q-.2 0-.375-.062t-.325-.213l-4.6-4.6q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l3.9 3.9l3.9-3.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213T12 14.95Z"
												></path>
											</svg>
										</button>
										<div
											@click=${(e: { stopPropagation: () => void }) => {
												e.stopPropagation()
											}}
											id="account"
											class="hidden absolute top-10 right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-20 py-0.5"
										>
											<div
												@click=${async () => {
													await browserAuth.addPermissions()
													window.location.reload()
												}}
												class="block cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
											>
												Edit Permissions
											</div>
											<div
												@click=${async () => {
													await browserAuth.logout()
													window.location.reload()
												}}
												class="block cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
											>
												Logout
											</div>
										</div>
									</div>
							  </div>`
							: typeof this.user === "undefined"
							? html`<button
									@click=${async () => {
										await browserAuth.login({
											redirect: window.location.origin + "/auth/auth-callback",
										})
										window.location.reload()
									}}
									target="_blank"
									class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
							  >
									Login
							  </button>`
							: ""}
					</div>
				</div>
			</header>

			${this.url.repo && this.url.project
				? html`<div
						class="w-full max-w-7xl mx-auto flex md:items-center gap-2 py-5 px-4 xl:px-0 md:flex-row flex-col"
				  >
						<div class="flex items-center font-medium text-lg">
							<svg class="w-4 h-4 mr-2" viewBox="0 0 16 16">
								<path
									fill="currentColor"
									fill-rule="evenodd"
									d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7a.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"
								/>
							</svg>
							<a
								target="_blank"
								href=${`https://github.com/${this.url.repo.split("/")[1]}`}
								class="self-center text-slate-900 truncate hover:text-[#098DAC] transition-colors duration-75"
							>
								${this.url.repo ? this.url.repo.split("/")[1] : ""}
							</a>
							<p class="mx-1.5">/</p>
							<a
								target="_blank"
								href=${`
								https://github.com/${this.url.repo.split("/")[1]}/${this.url.repo.split("/")[2]}`}
								class="self-center text-slate-900 truncate hover:text-[#098DAC] transition-colors duration-75"
							>
								${this.url.repo ? this.url.repo.split("/")[2] : ""}
							</a>
						</div>
						<div class="flex gap-2">
							${this.url.repo && this.branches
								? html`<div class="flex items-center flex-shrink-0 md:ml-2">
										<!-- Dropdown for all branches -->
										<div
											class="relative"
											x-data="{ open: false }"
											@click=${(e: Event) => {
												e.stopPropagation()
											}}
										>
											<button
												@click=${() => {
													this.shadowRoot?.querySelector("#branch")?.classList.toggle("hidden")
													this.shadowRoot?.querySelector("#account")?.classList.add("hidden")
													this.shadowRoot?.querySelector("#projects")?.classList.add("hidden")
												}}
											>
												<div
													@click=${() => {
														this.handleProjectDropdown()
													}}
													class="self-center flex items-center gap-2 text-left font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-[4px] cursor-pointer px-2 py-1.5 text-xs"
												>
													<svg class="w-4 h-4">
														<path
															fill="currentColor"
															fill-rule="evenodd"
															d="M11.75 2.5a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0a.75.75 0 0 1-1.5 0z"
														></path>
													</svg>
													${this.url.branch ? this.url.branch : "main"}
													${
														// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
														this.branches!.length > 1
															? html`<doc-icon
																	class="inline-block translate-y-0.5"
																	size="1em"
																	icon="mdi:unfold-more-horizontal"
															  ></doc-icon> `
															: ""
													}
												</div>
											</button>
											<div
												@click=${(e: { stopPropagation: () => void }) => {
													e.stopPropagation()
												}}
												id="branch"
												class="hidden absolute max-h-96 overflow-y-scroll top-10 left-0 w-auto bg-white border border-slate-200 rounded-md shadow-lg py-0.5 z-40"
											>
												${typeof this.branches === "object"
													? this.branches?.map(
															(branch) =>
																html`<a
																	href=${`/${this.url.path !== "" ? this.url.path : ""}
																?repo=${this.url.repo}&branch=${branch}&project=${this.url.project}${
																		this.url.module ? `&module=${this.url.module}` : ""
																	}`}
																	class="flex items-center gap-1 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
																>
																	${this.url.branch === branch ||
																	(!this.url.branch && branch === "main")
																		? html`<doc-icon
																				class="inline-block mr-1 translate-y-0.5"
																				size="1.2em"
																				icon="mdi:check"
																		  ></doc-icon>`
																		: html`<doc-icon
																				class="inline-block mr-1 translate-y-0.5 text-transparent"
																				size="1.2em"
																				icon="mdi:check"
																		  ></doc-icon>`}
																	<p class="truncate">${branch}</p>
																</a>`
													  )
													: ""}
											</div>
										</div>
								  </div>`
								: ""}
							${this.url.project && this.projects && this.branches
								? html`<div class="flex items-center flex-shrink-0">
										<!-- Dropdown for all projects -->
										<div
											class="relative"
											x-data="{ open: false }"
											@click=${(e: Event) => {
												e.stopPropagation()
											}}
										>
											<button
												@click=${() => {
													this.shadowRoot?.querySelector("#branch")?.classList.add("hidden")
													this.shadowRoot?.querySelector("#account")?.classList.add("hidden")
													this.shadowRoot?.querySelector("#projects")?.classList.toggle("hidden")
												}}
											>
												<div
													@click=${() => {
														this.handleProjectDropdown()
													}}
													class="self-center flex items-center gap-2 text-left font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-[4px] cursor-pointer px-2 py-1.5 text-xs"
												>
													<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" class="w-4 h-4">
														<path
															fill="currentColor"
															d="M8 18h8v-2H8v2Zm0-4h8v-2H8v2Zm-2 8q-.825 0-1.413-.588T4 20V4q0-.825.588-1.413T6 2h8l6 6v12q0 .825-.588 1.413T18 22H6Zm7-13V4H6v16h12V9h-5ZM6 4v5v-5v16V4Z"
														></path>
													</svg>
													${this.url.project.split("/").at(-1)}
													${
														// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
														this.projects!.length > 1
															? html`<doc-icon
																	class="inline-block translate-y-0.5"
																	size="1em"
																	icon="mdi:unfold-more-horizontal"
															  ></doc-icon> `
															: ""
													}
												</div>
											</button>
											<div
												@click=${(e: { stopPropagation: () => void }) => {
													e.stopPropagation()
												}}
												id="projects"
												class="hidden absolute max-h-96 overflow-y-scroll top-10 left-0 w-auto bg-white border border-slate-200 rounded-md shadow-lg py-0.5 z-40"
											>
												${typeof this.projects === "object"
													? this.projects?.map(
															(project) =>
																html`<a
																	href=${`/?repo=${this.url.repo}&project=${project.projectPath}`}
																	class="flex items-center gap-1 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
																>
																	${this.url.project === project.projectPath
																		? html`<doc-icon
																				class="inline-block mr-1 translate-y-0.5"
																				size="1.2em"
																				icon="mdi:check"
																		  ></doc-icon>`
																		: html`<doc-icon
																				class="inline-block mr-1 translate-y-0.5 text-transparent"
																				size="1.2em"
																				icon="mdi:check"
																		  ></doc-icon>`}
																	<p class="truncate">
																		${project.projectPath?.split("/").at(-2)}/${project.projectPath
																			?.split("/")
																			.at(-1)}
																	</p>
																</a>`
													  )
													: ""}
											</div>
										</div>
								  </div>`
								: ""}
						</div>
				  </div>`
				: ""}
			${this.url.path === ""
				? html`<div
						class=${"w-full max-w-7xl h-full flex-grow mx-auto flex justify-center px-4 pb-24" +
						(!this.modules ? " items-center" : " md:py-8 xl:px-0")}
				  >
						${!this.url.repo
							? html`<div class="max-w-lg w-full flex flex-col items-center gap-4">
									<h1 class="font-bold text-4xl text-slate-900 text-center">Open your Repo</h1>
									<p class="text-slate-600 w-full md:w-[400px] leading-relaxed mb-4 text-center">
										To access your projects, please enter the URL of your GitHub repository.
									</p>
									<div
										disabled=${this.url?.repo === undefined}
										class=${`px-1 gap-2 relative max-w-lg z-10 flex items-center w-full border bg-white rounded-lg transition-all relative ${
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
											(!this.isValidUrl() && this.repoURL.length > 0
												? "text-red-500"
												: "text-slate-900")}
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
							: this.projects === "load"
							? html`<div class="flex flex-col gap-0.5 mt-4">
									<div class="mx-auto">
										<div class="h-12 w-12 animate-spin mb-4">
											<div
												class="h-full w-full bg-surface-50 border-[#0891b2] border-4 rounded-full"
											></div>
											<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-slate-50"></div>
										</div>
									</div>
							  </div>`
							: this.projects === "no-access" && typeof this.user === "undefined"
							? html`<div class="flex flex-col gap-0.5 mt-4">
									<div
										class="py-4 px-8 w-full rounded-md bg-red-100 text-red-500 flex flex-col items-center justify-center"
									>
										<p class="mb-4 font-medium">
											You have to be logged in to access this repository.
										</p>
										<button
											@click=${async () => {
												await browserAuth.login({
													redirect: window.location.origin + "/auth/auth-callback",
												})
												window.location.reload()
											}}
											target="_blank"
											class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
										>
											Login
											<doc-icon
												class="inline-block ml-1 translate-y-0.5"
												size="1.2em"
												icon="mdi:arrow-top-right"
											></doc-icon>
										</button>
									</div>
							  </div>`
							: this.projects === "no-access" && typeof this.user === "object"
							? html`<div class="flex flex-col gap-0.5 mt-4">
									<div
										class="py-4 px-8 w-full rounded-md bg-red-100 text-red-500 flex flex-col items-center justify-center"
									>
										<p class="mb-4 font-medium">You don't have access to this repository.</p>
										<a
											href="https://github.com/apps/${publicEnv.PUBLIC_LIX_GITHUB_APP_NAME}/installations/select_target"
											target="_blank"
											class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
											>Configure Permissions
											<doc-icon
												class="inline-block ml-1 translate-y-0.5"
												size="1.2em"
												icon="mdi:arrow-top-right"
											></doc-icon>
										</a>
									</div>
							  </div>`
							: this.projects === "not-found"
							? html`<div class="flex flex-col gap-0.5 mt-4">
									<div
										class="py-4 px-8 w-full rounded-md bg-red-100 text-red-500 flex flex-col items-center justify-center"
									>
										<p class="mb-4 font-medium">The project could not be found.</p>
										<a
											href=${`/?repo=${this.url.repo}`}
											class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
											>Select a different project
										</a>
									</div>
							  </div>`
							: this.projects === "error"
							? html`<div class="flex flex-col gap-0.5 mt-4">
									<div
										class="py-4 px-8 w-full rounded-md bg-red-100 text-red-500 flex flex-col items-center justify-center"
									>
										<p class="mb-2 font-medium text-center">Your project settings seem invalid.</p>
										<p class="mb-8 text-center">
											Please make sure to use inlang's official links to properly load modules.
										</p>
										<a
											href=${`https://${this.url.repo}`}
											target="_blank"
											class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
											>Go to Repository
											<doc-icon
												class="inline-block ml-1 translate-y-0.5"
												size="1.2em"
												icon="mdi:arrow-top-right"
											></doc-icon>
										</a>
									</div>
							  </div>`
							: this.projects !== "no-access" &&
							  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							  this.projects!.length === 0
							? html`<div class="flex flex-col gap-0.5 mt-4">
									<div
										class="py-4 px-8 w-full rounded-md bg-red-100 text-red-500 flex flex-col items-center justify-center"
									>
										<p class="mb-2 font-medium text-center">No projects found.</p>
										<p class="mb-8 text-center">
											Creating a new project in the browser is not supported yet.
										</p>
										<a
											href=${(this.isProduction ? `https://inlang.com` : "http://localhost:3000") +
											"/c/guides"}
											target="_blank"
											class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
											>Follow a setup guide
											<doc-icon
												class="inline-block ml-1 translate-y-0.5"
												size="1.2em"
												icon="mdi:arrow-top-right"
											></doc-icon>
										</a>
									</div>
							  </div>`
							: !this.url.project &&
							  this.projects !== "no-access" &&
							  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							  this.projects!.length > 0
							? html`<div class="flex flex-col w-full max-w-lg items-center">
									<h1 class="font-bold text-4xl text-slate-900 mb-4 text-center">
										Select your project
									</h1>
									<p class="text-slate-600 w-full md:w-[400px] leading-relaxed text-center">
										Please select the project you want to manage from the list below.
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
																	`/?repo=${this.url.repo}&project=${project.projectPath}` +
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
							: this.modules
							? html`<div class="h-full w-full">
					<div class="md:mb-12 flex items-start justify-between flex-col-reverse md:flex-row md:gap-4">
					<div class="md:my-0 my-6">
							${
								this.url.install === "true"
									? html`<h1 class="font-bold md:text-4xl text-slate-900 md:mb-4 text-xl mb-2">
											Module successfully installed
									  </h1>`
									: this.url.uninstall === "true"
									? html`<h1 class="font-bold md:text-4xl text-slate-900 md:mb-4 text-xl mb-2">
											Module successfully uninstalled
									  </h1>`
									: html`<h1 class="font-bold md:text-4xl text-slate-900 md:mb-4 text-xl mb-2">
											Manage your inlang project
									  </h1>`
							}
							<p class="text-slate-600 w-full md:w-[400px] leading-relaxed">
								Manage your project settings here.
							</p>
							</div>
							<div class="flex items-center gap-2">
							<a
								class="bg-slate-200 text-slate-900 md:block hidden hover:bg-slate-300 truncate text-center px-4 py-2 rounded-md font-medium transition-colors"
								href=${
									(this.isProduction ? `https://fink.inlang.com` : "http://localhost:400") +
									`/${this.url.repo}`
								}
								target="_blank"
							>
								Go to Fink - Editor
							</a>
							<button
							class="bg-slate-800 text-white text-center md:block hidden px-4 py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
							@click=${() => {
								window.location.href =
									(this.isProduction ? `https://inlang.com` : "http://localhost:3000") +
									`/?repo=${this.url.repo}&project=${this.url.project}`
							}}
						>
							Install a module
						</button>
						</div>
							</div>

<!-- Popup to confirm -->
${
	this.confirmPopup === "removeLanguageTag"
		? html`<div
				class="fixed z-50 inset-0 overflow-y-auto"
				aria-labelledby="modal-title"
				role="dialog"
				aria-modal="true"
		  >
				<div class="flex items-center justify-center min-h-screen">
					<div
						class="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
						aria-hidden="true"
					></div>
					<div
						class="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full"
						role="document"
					>
						<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
							<div class="sm:flex sm:items-start">
								<div
									class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
								>
									<svg
										class="h-6 w-6 text-red-600"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</div>
								<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
									<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
										Remove languageTag
									</h3>
									<div class="mt-2">
										<p class="text-sm text-gray-500">
											Are you sure you want to remove this languageTag?
										</p>
									</div>
								</div>
							</div>
						</div>
						<div class="bg-gray-50 px-4 py-3 sm:px-6 flex-col flex sm:flex-row-reverse gap-2">
							<button
								@click=${async () => {
									const selectedTag = this.languageTags?.find((tag) => tag.selected === true)

									this.confirmPopup = undefined
									if (selectedTag && typeof selectedTag !== "string")
										await this.removeLanguageTag(selectedTag.name)
								}}
								type="button"
								class="text-white truncate text-center px-4 py-2 rounded-md font-medium transition-colors bg-red-500 hover:bg-red-400"
							>
								Remove
							</button>
							<button
								@click=${() => {
									this.confirmPopup = undefined
								}}
								type="button"
								class="bg-slate-200 text-slate-900 hover:bg-slate-300 truncate text-center px-4 py-2 rounded-md font-medium transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
		  </div>`
		: ""
} 

							<div class="mb-12">
							<h2 class="text-lg font-semibold my-4">Language Tags</h2>
							<div class=${
								this.languageTags?.some((tag) => tag.loading === true) ||
								this.newLanguageTagLoading === true
									? "cursor-wait"
									: "w-full"
							}
							>
							<div class=${
								this.languageTags?.some((tag) => tag.loading === true) ||
								this.newLanguageTagLoading === true
									? "pointer-events-none"
									: "w-full"
							}
							>
								${
									this.languageTags && this.languageTags.length > 0
										? html`<div
												class="flex flex-wrap gap-1 border border-slate-200 rounded-2xl bg-slate-100 p-1"
										  >
												${
													// @ts-ignore
													this.languageTags.map((tag: Record<string, string | boolean>) => {
														return html`<div
															class=${"pl-3 py-1 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 " +
															(tag.loading ? "opacity-25 pointer-events-none" : "")}
														>
															<p class="font-medium">${tag.name}</p>
															${tag.sourceLanguageTag
																? html`<p class="text-sm text-slate-500 mr-3">(Source)</p>`
																: tag.loading
																? html`<div class="mr-3 w-5 h-5 relative animate-spin">
																		<div
																			class="h-5 w-5 border-2 border-[#098DAC] rounded-full"
																		></div>
																		<div
																			class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-white"
																		></div>
																  </div>`
																: html`<button
																		@click=${() => {
																			if (typeof tag.name === "string") {
																				// @ts-ignore
																				for (const t of this.languageTags) t.selected = false

																				tag.selected = !tag.selected

																				this.confirmPopup = "removeLanguageTag"
																			}
																		}}
																		class=${"text-slate-500 text-sm w-6 h-6 mr-1 flex items-center justify-center font-medium transition-colors hover:text-slate-600 hover:bg-slate-50 rounded-md " +
																		(typeof this.user === "undefined" ? "cursor-not-allowed" : "")}
																  >
																		<doc-icon
																			class="inline-block translate-y-0.5"
																			size="1.2em"
																			icon="mdi:close"
																		></doc-icon>
																  </button>`}
														</div>`
													})
												}
												<div
													class=${"relative flex " +
													(this.newLanguageTagLoading ? "opacity-25 pointer-events-none" : "")}
												>
													<input
														id="language-tag-input"
														.value=${this.newLanguageTag}
														@input=${(e: InputEvent) => {
															if (!this.newLanguageTagLoading)
																this.newLanguageTag = (e.target as HTMLInputElement).value
														}}
														@keydown=${async (e: KeyboardEvent) => {
															if (
																e.key === "Enter" &&
																!this.newLanguageTagLoading &&
																isValidLanguageTag(this.newLanguageTag)
															) {
																;(
																	this.shadowRoot?.querySelector(
																		"#language-tag-input"
																	) as HTMLInputElement
																).blur()
																await this.addLanguageTag()
															}
														}}
														class=${"px-3 py-1 focus:outline-0 focus:ring-0 bg-white border w-44 pr-6 truncate border-slate-200 rounded-xl flex items-center justify-between gap-2 " +
														(this.newLanguageTag.length > 0 &&
														!isValidLanguageTag(this.newLanguageTag)
															? "focus-within:border-red-500"
															: "focus-within:border-[#098DAC]")}
														placeholder="Add languageTag"
													/>
													${this.newLanguageTagLoading
														? html`<div class="mr-3 w-5 h-5 absolute animate-spin right-0 top-1.5">
																<div class="h-5 w-5 border-2 border-[#098DAC] rounded-full"></div>
																<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-white"></div>
														  </div>`
														: !isValidLanguageTag(this.newLanguageTag)
														? ""
														: html`<button
																@click=${async () => await this.addLanguageTag()}
																class=${"text-slate-500 absolute right-0.5 top-1/2 -translate-y-1/2 text-sm w-6 h-6 mr-1 flex items-center justify-center font-medium transition-colors hover:text-slate-600 hover:bg-slate-50 rounded-md " +
																(typeof this.user === "undefined" ? "cursor-not-allowed" : "")}
														  >
																<doc-icon
																	class="inline-block translate-y-0.5"
																	size="1.2em"
																	icon="mdi:plus"
																></doc-icon>
														  </button>`}
												</div>
										  </div>`
										: html`<div
												class="py-16 border border-dashed border-slate-300 px-8 w-full rounded-md bg-slate-100 text-slate-500 flex flex-col items-center justify-center"
										  >
												<p class="mb-4 font-medium">You don't have any languageTags</p>
												<a
													href=${(this.isProduction
														? `https://inlang.com`
														: "http://localhost:3000") + "/c/lint-rules"}
													target="_blank"
													class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
													>Add basic languageTag "en"
												</a>
										  </div>`
								}
								</div>
								</div>
								</div>
							<div class="mb-12">
							<h2 class="text-lg font-semibold my-4">Plugins</h2>
								${
									this.modules &&
									this.modules !== "empty" &&
									this.modules?.filter((module) => module.id.includes("plugin.")).length > 0
										? html`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												${
													// @ts-ignore
													this.modules
														?.filter((module) => module.id.includes("plugin."))
														.map(
															(module: Record<string, any>) =>
																html`<div
																	class="p-6 w-full bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2"
																>
																	<div class="mb-4">
																		<div class="w-full flex items-center justify-between mb-4">
																			<h2 class="font-semibold">${module.displayName.en}</h2>
																			<p class="text-sm font-mono">${module.version}</p>
																		</div>
																		<p class="text-slate-500 line-clamp-2 text-sm">
																			${module.description.en}
																		</p>
																	</div>
																	<div
																		class="flex md:items-center flex-col md:flex-row justify-between gap-4"
																	>
																		<a
																			target="_blank"
																			href=${(this.isProduction
																				? `https://inlang.com`
																				: "http://localhost:3000") +
																			`/m/${
																				// @ts-ignore
																				module.uniqueID
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
																		<a
																			@click=${() => {
																				posthog.capture("MANAGE Uninstall module", {
																					$set: {
																						name:
																							typeof this.user === "object"
																								? this.user.username
																								: undefined,
																					},
																					$set_once: { initial_url: "https://manage.inlang.com" },
																				})
																			}}
																			href=${`/uninstall?repo=${this.url.repo}&project=${this.url.project}&module=${module.id}`}
																			class="text-red-500 text-sm font-medium transition-colors hover:text-red-400"
																		>
																			<doc-icon
																				class="inline-block mr-0.5 translate-y-0.5"
																				size="1em"
																				icon="mdi:delete"
																			></doc-icon>
																			Uninstall
																		</a>
																	</div>
																</div>`
														)
												}
										  </div>`
										: html`<div
												class="py-16 border border-dashed border-slate-300 px-8 w-full rounded-md bg-slate-100 text-slate-500 flex flex-col items-center justify-center"
										  >
												<p class="mb-4 font-medium">You don't have any plugins installed.</p>
												<a
													href=${(this.isProduction
														? `https://inlang.com`
														: "http://localhost:3000") + "/c/plugins"}
													target="_blank"
													class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
													>Install a plugin
												</a>
										  </div>`
								}
								</div>
								<div>
							<h2 class="text-lg font-semibold my-4">Lint Rules</h2>
								${
									this.modules &&
									this.modules !== "empty" &&
									this.modules?.filter((module) => module.id.includes("messageLintRule.")).length >
										0
										? html`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												${
													// @ts-ignore
													this.modules
														?.filter((module) => module.id.includes("messageLintRule."))
														.map(
															(module: Record<string, any>) =>
																html`<div
																	class="p-6 w-full bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2"
																>
																	<div class="mb-4">
																		<div class="w-full flex items-center justify-between mb-4">
																			<h2 class="font-semibold">${module.displayName.en}</h2>
																			<p class="text-sm font-mono">${module.version}</p>
																		</div>
																		<p class="text-slate-500 line-clamp-2 text-sm">
																			${module.description.en}
																		</p>
																	</div>
																	<div
																		class="flex md:items-center flex-col md:flex-row justify-between gap-4"
																	>
																		<a
																			target="_blank"
																			href=${(this.isProduction
																				? `https://inlang.com`
																				: "http://localhost:3000") +
																			`/m/${
																				// @ts-ignore
																				module.uniqueID
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
																		<a
																			@click=${() => {
																				posthog.capture("MANAGE Uninstall module", {
																					$set: {
																						name:
																							typeof this.user === "object"
																								? this.user.username
																								: undefined,
																					},
																					$set_once: { initial_url: "https://manage.inlang.com" },
																				})
																			}}
																			href=${`/uninstall?repo=${this.url.repo}&project=${this.url.project}&module=${module.id}`}
																			class="text-red-500 text-sm font-medium transition-colors hover:text-red-400"
																		>
																			<doc-icon
																				class="inline-block mr-0.5 translate-y-0.5"
																				size="1em"
																				icon="mdi:delete"
																			></doc-icon>
																			Uninstall
																		</a>
																	</div>
																</div>`
														)
												}
										  </div>`
										: html`<div
												class="py-16 border border-dashed border-slate-300 px-8 w-full rounded-lg bg-slate-100 text-slate-500 flex flex-col items-center justify-center"
										  >
												<p class="mb-4 font-medium">You don't have any rules installed.</p>
												<a
													href=${(this.isProduction
														? `https://inlang.com`
														: "http://localhost:3000") + "/c/lint-rules"}
													target="_blank"
													class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
													>Install a lint rule
												</a>
										  </div>`
								}
								</div>
							</div>
					  </div>
					 <div class="flex-grow"></div>
					  `
							: ""}
				  </div>`
				: this.url.path === "install"
				? html`<div
						class="w-full max-w-7xl h-full flex-grow mx-auto flex justify-center px-4 pb-24"
				  >
						<inlang-install jsonURL=${JSON.stringify(this.url)}></inlang-install>
				  </div>`
				: this.url.path === "uninstall"
				? html`<div
						class="w-full max-w-7xl h-full flex-grow mx-auto flex justify-center px-4 pb-24"
				  >
						<inlang-uninstall jsonURL=${JSON.stringify(this.url)}></inlang-uninstall>
				  </div>`
				: ""}
		</main>`
	}
}

@customElement("inlang-logo")
export class InlangLogo extends TwLitElement {
	@property({ type: String })
	size: string = "1rem"
	override render(): TemplateResult {
		return html`
			<svg
				xmlns="http://www.w3.org/2000/svg"
				version="1.0"
				width="${this.size}"
				height="${this.size}"
				viewBox="0 0 256.000000 256.000000"
				preserveAspectRatio="xMidYMid meet"
			>
				<metadata>Created by potrace 1.14, written by Peter Selinger 2001-2017</metadata>
				<g
					transform="translate(0.000000,256.000000) scale(0.100000,-0.100000)"
					fill="#000000"
					stroke="none"
				>
					<path
						d="M95 2546 c-41 -18 -83 -69 -90 -109 -3 -18 -4 -550 -3 -1184 3 -1145 3 -1152 24 -1179 11 -15 33 -37 48 -48 27 -21 31 -21 1206 -21 1175 0 1179 0 1206 21 15 11 37 33 48 48 21 27 21 31 21 1206 0 1175 0 1179 -21 1206 -11 15 -33 37 -48 48 -27 21 -33 21 -1194 23 -955 2 -1173 0 -1197 -11z m570 -630 c81 -34 97 -133 31 -193 -29 -27 -44 -33 -81 -33 -83 0 -135 47 -135 122 0 40 21 73 64 99 37 23 74 24 121 5z m1435 -636 l0 -580 -120 0 -120 0 0 580 0 580 120 0 120 0 0 -580z m-566 270 c63 -32 109 -89 135 -167 20 -58 21 -84 21 -373 l0 -310 -120 0 -120 0 0 278 c0 252 -2 281 -20 319 -24 55 -70 83 -134 83 -66 0 -120 -32 -146 -85 -19 -38 -20 -62 -20 -318 l0 -277 -120 0 -120 0 0 435 0 435 115 0 114 0 3 -77 c2 -58 6 -73 12 -58 27 58 79 103 151 132 17 7 66 11 115 10 68 -2 95 -7 134 -27z m-804 -415 l0 -435 -120 0 -120 0 0 435 0 435 120 0 120 0 0 -435z"
					/>
				</g>
			</svg>
		`
	}
}

@customElement("inlang-folder")
export class InlangFolder extends TwLitElement {
	@property({ type: String })
	size: string = "1rem"
	override render(): TemplateResult {
		return html`
			<svg
				width="${this.size}"
				height="100%"
				viewBox="0 0 201 138"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M1 126.403V29.0998V11.078C1 5.51208 5.51207 1 11.078 1H122.804C126.13 1 129.242 2.64088 131.12 5.38534L144.352 24.7145C146.23 27.459 149.342 29.0998 152.668 29.0998H189.963C195.529 29.0998 200.041 33.6119 200.041 39.1778V126.403C200.041 131.969 195.529 136.481 189.963 136.481H11.078C5.51208 136.481 1 131.969 1 126.403Z"
					fill="url(#paint0_linear_3071_9264)"
					stroke="white"
					stroke-width="1.67261"
				/>
				<path
					d="M1 126.403V39.1779C1 33.6119 5.51208 29.0998 11.078 29.0998H125.092C127.829 29.0998 130.448 27.9867 132.348 26.0163L153.491 4.08356C155.391 2.11314 158.01 1 160.747 1H189.963C195.529 1 200.041 5.51207 200.041 11.078V126.403C200.041 131.969 195.529 136.481 189.963 136.481H11.078C5.51208 136.481 1 131.969 1 126.403Z"
					fill="black"
					stroke="white"
					stroke-width="1.67261"
				/>
				<path
					d="M59.4499 112V68.3636H71.5521V112H59.4499ZM65.5294 62.7386C63.7302 62.7386 62.1866 62.142 60.8987 60.9489C59.6298 59.7367 58.9953 58.2879 58.9953 56.6023C58.9953 54.9356 59.6298 53.5057 60.8987 52.3125C62.1866 51.1004 63.7302 50.4943 65.5294 50.4943C67.3286 50.4943 68.8627 51.1004 70.1317 52.3125C71.4196 53.5057 72.0635 54.9356 72.0635 56.6023C72.0635 58.2879 71.4196 59.7367 70.1317 60.9489C68.8627 62.142 67.3286 62.7386 65.5294 62.7386ZM92.549 86.7727V112H80.4467V68.3636H91.9808V76.0625H92.4922C93.4581 73.5246 95.0774 71.517 97.3501 70.0398C99.6229 68.5436 102.379 67.7955 105.617 67.7955C108.647 67.7955 111.29 68.4583 113.543 69.7841C115.797 71.1098 117.549 73.0038 118.799 75.4659C120.049 77.9091 120.674 80.8258 120.674 84.2159V112H108.572V86.375C108.591 83.7045 107.909 81.6212 106.526 80.125C105.144 78.6098 103.24 77.8523 100.816 77.8523C99.1873 77.8523 97.7479 78.2027 96.4979 78.9034C95.2668 79.6042 94.3009 80.6269 93.6001 81.9716C92.9183 83.2973 92.5679 84.8977 92.549 86.7727ZM141.515 53.8182V112H129.412V53.8182H141.515Z"
					fill="white"
				/>
				<defs>
					<linearGradient
						id="paint0_linear_3071_9264"
						x1="100.52"
						y1="1"
						x2="100.52"
						y2="136.481"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#3C4044" />
						<stop offset="0.199292" />
					</linearGradient>
				</defs>
			</svg>
		`
	}
}

@customElement("inlang-menu")
export class InlangMenu extends TwLitElement {
	@property({ type: Object })
	jsonURL: Record<string, string | undefined> = {}

	override render(): TemplateResult {
		return html`
			<div class="flex flex-col gap-4">
				<a
					href=${`/install?${this.jsonURL.repo ? `repo=${this.jsonURL.repo}` : ""}${
						this.jsonURL.project ? `&project=${this.jsonURL.project}` : ""
					}`}
					class="bg-slate-800 text-white text-center py-2 rounded-md font-medium hover:bg-slate-900 transition-colors"
				>
					Install a module
				</a>
				<a
					class="bg-slate-200 text-white text-center py-2 rounded-md font-medium cursor-not-allowed"
				>
					Uninstall a module
				</a>
				<a
					class="bg-slate-200 text-white text-center py-2 rounded-md font-medium cursor-not-allowed mb-4"
				>
					Update a module
				</a>
				<a
					href="https://github.com/apps/${publicEnv.PUBLIC_LIX_GITHUB_APP_NAME}/installations/select_target"
					target="_blank"
					class="text-[#098DAC] font-medium transition-colors hover:text-[#06b6d4]"									"
				>
					Edit Permissions
					<doc-icon class="inline-block ml-1 translate-y-0.5" size="1.2em" icon="mdi:arrow-top-right"></doc-icon>
				</a>
			</div>
		`
	}
}
