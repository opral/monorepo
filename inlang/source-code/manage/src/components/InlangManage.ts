import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement"

import "./InlangInstall"

@customElement("inlang-manage")
export class InlangManage extends TwLitElement {
	@property({ type: Object })
	query: Record<string, string | undefined> = {}

	@property({ type: String })
	step: string = ""

	override connectedCallback() {
		super.connectedCallback()
		// put the query params into an object, example /install?repo=github.com/inlang/monorepo&module=plugin.inlang.mFunctionMatcher
		if (window.location.search !== "") {
			const query = {
				path: window.location.pathname.replace("/", ""),
				...Object.fromEntries(
					window.location.search
						.slice(1)
						.split("&")
						.map((x) => x.split("="))
						.map(([key, value]) => [key, value])
				),
			}
			this.query = query
		} else {
			this.query = {
				path: undefined,
			}
		}
	}

	override render(): TemplateResult {
		return html` <main class="w-full h-screen flex justify-center items-center px-4">
			<div class="w-full max-w-md h-auto bg-slate-50 border border-slate-200 p-4 rounded-lg">
				<div class="flex items-center gap-2 border-b border-b-slate-200 pb-4 mb-4">
					<inlang-logo></inlang-logo>
					<h1 class="font-semibold capitalize">${this.query.path ? this.query.path : "Manage"}</h1>
				</div>
				${!this.query.path
					? html`<inlang-menu></inlang-menu>`
					: this.query.path === "install"
					? html`<inlang-install></inlang-install>`
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
	override render(): TemplateResult {
		return html`
			<p class="text-slate-500 mb-8">Manage your inlang project.</p>
			<div class="flex flex-col gap-4">
				<button
					class="bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors"
				>
					Install a module
				</button>
				<button class="bg-slate-200 text-white py-2 rounded-lg font-medium cursor-not-allowed">
					Uninstall a module
				</button>
				<button class="bg-slate-200 text-white py-2 rounded-lg font-medium cursor-not-allowed">
					Update a module
				</button>
			</div>
		`
	}
}
