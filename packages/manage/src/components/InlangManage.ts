import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"

import "./InlangInstall"
import { createNodeishMemoryFs, openRepository } from "@lix-js/client"
import { listProjects } from "@inlang/sdk"

@customElement("inlang-manage")
export class InlangManage extends TwLitElement {
	@property({ type: Object })
	url: Record<string, string | undefined> = {}

	@property({ type: String })
	repoURL: string = ""

	@property({ type: Object })
	projects: Record<string, string>[] | undefined = undefined

	async projectHandler() {
		const repo = await openRepository(`http://localhost:3001/git/${this.url.repo}`, {
			nodeishFs: createNodeishMemoryFs(),
		})

		this.projects = await listProjects(repo.nodeishFs, "/")
	}

	/* This function generates the install link for the user based on a repo url */
	generateManageLink() {
		const url = new URL(this.repoURL)
		return `/?repo=${url.host}${url.pathname.split("/").slice(0, 3).join("/")}`
	}

	override connectedCallback() {
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
	}

	override render(): TemplateResult {
		return html` <main
			class="w-full h-screen flex justify-center items-center px-4"
			@click=${() => {
				this.shadowRoot?.querySelector("#projects")?.classList.add("hidden")
			}}
		>
			<div class="w-full max-w-md h-auto bg-slate-50 border border-slate-200 p-4 rounded-lg">
				<div class="flex items-center gap-4 justify-between border-b border-b-slate-200 pb-4 mb-4">
					<div class="flex items-center gap-2">
						<inlang-logo></inlang-logo>
						<h1 class="font-semibold capitalize">${this.url.path ? this.url.path : "Manage"}</h1>
					</div>
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
								this.shadowRoot?.querySelector("#projects")?.classList.toggle("hidden")
							}}
							class="bg-white text-slate-600 border flex justify-center items-center h-10 relative rounded-md px-4 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
						>
							Projects
						</button>
						<div
							id="projects"
							class="hidden absolute top-12 right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-20"
						>
							${this.projects?.map(
								(project) =>
									html`<a
										href=${`/?repo=${project.projectPath}`}
										class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
									>
										${project.projectPath}
									</a>`
							)}
						</div>
					</div>
				</div>
				${!this.url.path
					? html` <div
								disabled=${this.url.repo}
								class=${`px-2 gap-2 mb-8 relative z-10 flex items-center w-full border border-slate-200 bg-white rounded-lg focus-within:border-[#098DAC] transition-all ${
									this.url.repo ? "opacity-50" : ""
								}`}
							>
								<input
									.value=${this.url.repo ? this.url.repo : this.repoURL}
									@input=${(e: InputEvent) => {
										this.repoURL = (e.target as HTMLInputElement).value
									}}
									@keydown=${(e: KeyboardEvent) => {
										if (e.key === "Enter") {
											window.location.href = this.generateManageLink()
										}
									}}
									disabled=${this.url.repo}
									class="active:outline-0 px-2 disabled:cursor-not-allowed focus:outline-0 focus:ring-0 border-0 h-14 grow placeholder:text-slate-500 placeholder:font-normal placeholder:text-base"
									placeholder="https://github.com/user/example"
								/>
								<button
									@click=${() => {
										window.location.href = this.generateManageLink()
									}}
									disabled=${this.url.repo}
									class="bg-white text-slate-600  disabled:cursor-not-allowed border flex justify-center items-center h-10 relative rounded-md px-4 border-slate-200 transition-all duration-100 text-sm font-medium hover:bg-slate-100"
								>
									Install
								</button>
							</div>
							<inlang-menu jsonURL=${JSON.stringify(this.url)}></inlang-menu>`
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
					href=${`/install?repo=${this.jsonURL.repo}`}
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
