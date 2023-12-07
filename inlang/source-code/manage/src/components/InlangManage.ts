import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"
import { z } from "zod"
import "./InlangInstall"
import { createNodeishMemoryFs, openRepository } from "@lix-js/client"
import { listProjects } from "@inlang/sdk"
import { browserAuth, getUser } from "@lix-js/client/src/browser-auth.ts"

@customElement("inlang-manage")
export class InlangManage extends TwLitElement {
	@property({ type: Object })
	url: Record<string, string | undefined> = {}

	@property({ type: String })
	repoURL: string = ""

	@property({ type: Object })
	projects: Record<string, string>[] | undefined | "load" = "load"

	@property({ type: Object })
	user: Record<string, any> | undefined | "load" = "load"

	@query("#repo-input")
	repoInput: HTMLInputElement | undefined

	async projectHandler() {
		const repo = await openRepository(`http://localhost:3001/git/${this.url.repo}`, {
			nodeishFs: createNodeishMemoryFs(),
		})

		this.projects = await listProjects(repo.nodeishFs, "/")
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

		const user = await getUser().catch(() => {
			this.user = undefined
		})
		if (user) {
			this.user = user
		}

		if (this.url.path === "" && !this.url.repo && this.user) this.repoInput?.focus(), 0
	}

	override render(): TemplateResult {
		return html` <main class="w-full h-screen flex justify-center items-center px-4 bg-slate-50">
			<div class="w-full max-w-lg h-auto bg-white border border-slate-200 p-6 rounded-lg">
				<div class="flex items-center gap-4 justify-between border-b border-b-slate-200 pb-3 mb-4">
					<div class="flex items-center gap-2">
						<inlang-logo></inlang-logo>
						<h1 class="font-semibold capitalize">
							${this.url.path !== ""
								? html`<a
										class="hover:text-slate-500 transition-colors duration-100"
										href=${`/` +
										(this.user ? `?repo=${this.url.repo}` : "") +
										(this.url.project ? `&project=${this.url.project}` : "")}
										>Manage</a
								  >`
								: "Manage"}
							${this.url.path && `/ ${this.url.path}`}
						</h1>
					</div>
					<div>
						${this.user === "load"
							? html`<div class="animate-pulse h-9 w-20 rounded-md bg-slate-100"></div>`
							: this.user
							? html`<button
									class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md pl-2 pr-3 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
									@click=${async () => {
										await browserAuth.logout()
										window.location.href = "/"
									}}
							  >
									<img src=${this.user.avatarUrl} class="w-6 h-6 rounded-full mr-2" />
									Logout
							  </button>`
							: html`<button
									class="bg-white text-slate-600 border flex justify-center items-center h-9 relative rounded-md px-2 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
									@click=${async () => {
										await browserAuth.login()
										window.location.reload()
									}}
							  >
									Login
							  </button>`}
					</div>
				</div>
				${this.user && this.user !== "load"
					? html`<div class="border-b border-slate-200 mb-4 pb-4">
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
									(!this.isValidUrl() && this.repoURL.length > 0
										? "text-red-500"
										: "text-slate-900")}
									placeholder="https://github.com/user/example"
								/>
								<button
									@click="${() => {
										if (this.isValidUrl())
											this.url.repo // delete repo and project from url
												? (window.location.href = "/")
												: (window.location.href =
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
							${this.projects === "load"
								? html`<div class="flex flex-col gap-0.5 mt-4">
										<div class="animate-pulse h-12 w-full rounded-md bg-slate-100"></div>
								  </div>`
								: html`<div class="flex flex-col gap-0.5 mt-4">
										${this.projects?.map(
											(project) =>
												html`<button
													@click=${() => {
														if (this.url.path === "install" && !this.url.project) {
															window.location.href = `/install?repo=${this.url.repo}&project=${project.projectPath}`
														} else {
															this.url = {
																...this.url,
																project: project.projectPath,
															}
															window.history.pushState(
																{},
																"",
																`?repo=${this.url.repo}&project=${project.projectPath}` +
																	(this.url.module ? `&module=${this.url.module}` : "")
															)
														}
													}}
													class=${"flex gap-4 group items-center px-4 py-2 text-sm rounded-md " +
													(this.url.project === project.projectPath
														? "bg-slate-100 text-slate-900"
														: "text-slate-500 hover:bg-slate-50 hover:text-slate-600")}
												>
													${this.url.project === project.projectPath
														? html`<doc-icon
																icon="mdi:folder-open"
																size="1.4em"
																class="inline-block aspect-square mt-1.5"
														  ></doc-icon>`
														: html`<doc-icon
																	icon="mdi:folder"
																	size="1.4em"
																	class="inline-block aspect-square mt-1.5 group-hover:hidden"
																></doc-icon
																><doc-icon
																	icon="mdi:folder-open"
																	size="1.4em"
																	class="aspect-square mt-1.5 hidden group-hover:inline-block"
																></doc-icon>`}
													${project.projectPath}
												</button>`
										)}
								  </div>`}
					  </div>`
					: ""}
				${!this.url.path
					? html` <inlang-menu jsonURL=${JSON.stringify(this.url)}></inlang-menu>`
					: this.url.path === "install"
					? html`<inlang-install jsonURL=${JSON.stringify(this.url)}></inlang-install>`
					: ""}
			</div>
		</main>`
	}
}

@customElement("inlang-logo")
export class InlangLogo extends TwLitElement {
	override render(): TemplateResult {
		return html`
			<svg
				xmlns="http://www.w3.org/2000/svg"
				version="1.0"
				width="24px"
				height="24px"
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
					class="bg-slate-200 text-white text-center py-2 rounded-md font-medium cursor-not-allowed"
				>
					Update a module
				</a>
			</div>
		`
	}
}
