import type { Endpoint } from "comlink"

type Disposable = {
	dispose(): void
}

type WebView = {
	postMessage(message: unknown): void
	onDidReceiveMessage(handler: (message: unknown) => void): Disposable
}

export function vscodeWebviewEndpoint(webview: WebView): Endpoint {
	const listeners = new Map<any, Disposable>()

	return {
		postMessage(message) {
			webview.postMessage(message)
		},

		addEventListener(_, listener) {
			const disposable = webview.onDidReceiveMessage((data) => {
				const ev = new MessageEvent("message", { data })
				"handleEvent" in listener ? listener.handleEvent(ev) : listener(ev)
			})

			listeners.set(listener, disposable)
		},

		removeEventListener(_, listener) {
			const disposable = listeners.get(listener)
			if (disposable) disposable.dispose()
		},
	}
}
