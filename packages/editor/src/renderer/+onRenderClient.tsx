import "core-js/stable/structured-clone" // polyfill structuredClone
import { type Component, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { render } from "solid-js/web"
import Root from "./+Root.jsx"
import { setCurrentPageContext } from "./state.js"
import type { PageContextRenderer } from "./types.js"
import * as Sentry from "@sentry/browser"
import { MetaProvider } from "@solidjs/meta"
import { posthog } from "posthog-js"
import { publicEnv } from "@inlang/env-variables"

posthog.init(publicEnv.PUBLIC_POSTHOG_TOKEN ?? "", {
	api_host: import.meta.env.PROD ? "https://tm.inlang.com" : "http://localhost:4005",
	capture_performance: false,
	autocapture: {
		capture_copied_text: true,
	},
})

// import the css
import "./app.css"

// only imported client side as web components are not supported server side
// importing the shoelace components that are used.
import "@shoelace-style/shoelace/dist/components/alert/alert.js"
import "@shoelace-style/shoelace/dist/components/badge/badge.js"
import "@shoelace-style/shoelace/dist/components/button/button.js"
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js"
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js"
import "@shoelace-style/shoelace/dist/components/menu/menu.js"
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js"
import "@shoelace-style/shoelace/dist/components/details/details.js"
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js"
import "@shoelace-style/shoelace/dist/components/tag/tag.js"
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js"
import "@shoelace-style/shoelace/dist/components/card/card.js"
import "@shoelace-style/shoelace/dist/components/input/input.js"
import "@shoelace-style/shoelace/dist/components/divider/divider.js"
import "@shoelace-style/shoelace/dist/components/tree/tree.js"
import "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js"
import "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js"
import "@shoelace-style/shoelace/dist/components/button-group/button-group.js"
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js"
import "@shoelace-style/shoelace/dist/components/select/select.js"
import "@shoelace-style/shoelace/dist/components/option/option.js"
// import inlang components
import "@inlang/settings-component"
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js"
setBasePath("./../../node_modules/@shoelace-style/shoelace/dist")

// enable error logging via sentry in production
if (import.meta.env.PROD) {
	Sentry.init({
		dsn: publicEnv.PUBLIC_FINK_SENTRY_DSN,
		integrations: [],
		tracesSampleRate: 0.1,
	})
}

let isFirstRender = true
const rootElement = document.querySelector("#root") as HTMLElement

const [currentPage, setCurrentPage] = createSignal<Component>()
const [currentPageProps, setCurrentPageProps] = createStore<Record<string, unknown>>({})

export default function onRenderClient(pageContext: PageContextRenderer) {
	try {
		setCurrentPageContext(pageContext)
		setCurrentPage(() => pageContext.Page)
		setCurrentPageProps(pageContext.pageProps)
		if (isFirstRender) {
			// The editor is only rendered client-side.
			//
			// In the future, the editor might be server-side rendered.
			// For now, the trouble of isomorphic rendering the editor is not worth it.
			render(
				() => (
					<MetaProvider>
						<Root page={currentPage()!} pageProps={currentPageProps} />
					</MetaProvider>
				),
				rootElement
			)
			isFirstRender = false
		}
		// https://posthog.com/docs/integrate/client/js#one-page-apps-and-page-views
		posthog.capture("$pageview")
	} catch (e) {
		console.error("ERROR in renderer", e)
	}
}
