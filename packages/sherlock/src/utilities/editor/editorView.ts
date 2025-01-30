import * as vscode from "vscode"
import type {
	CancellationToken,
	Disposable,
	Webview,
	WebviewView,
	WebviewViewProvider,
	WebviewViewResolveContext,
} from "vscode"

import { Extension } from "./helper/Extension.js"
import { getUri } from "./helper/getUri.js"
import { getNonce } from "./helper/getNonce.js"

// ---- These imports come from your old code snippet. Update paths to match your project.
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { getSelectedBundleByBundleIdOrAlias } from "../helper.js"
import { msg } from "../messages/msg.js"

// Example interface (from old snippet) for "updateBundle" messages
interface UpdateBundleMessage {
	command: string
	bundle: {
		entityId: string
		entity: "variant" | "message" // etc.
		newData?: {
			id: string
			messageId: string
			matches: Array<{ type: string; key: string }>
			pattern: Array<{ type: string; value?: string }>
		}
	}
}

/**
 * The viewType property from the class version:
 */
export const EDITOR_VIEW_TYPE = "editorView"

export function createEditorView(
	extensionUri: vscode.Uri,
	// optionally pass a bundleId if needed, like the old `editorView(args: { bundleId: string })`
	initialBundleId?: string
): WebviewViewProvider & {
	setBundleId: (newBundleId: string) => void
	getBundleId: () => string | undefined
	dispose: () => void
} {
	// Private, internal variables ("fields") that used to be on the class
	let view: WebviewView | undefined
	let disposables: Disposable[] = []
	let bundleId = initialBundleId

	/**
	 * The method that gets called when the WebviewView becomes visible.
	 * You must implement this to satisfy `WebviewViewProvider`.
	 */
	async function resolveWebviewView(
		webviewView: WebviewView,
		_context: WebviewViewResolveContext,
		_token: CancellationToken
	) {
		view = webviewView

		view.webview.options = {
			enableScripts: true,
			localResourceRoots: [extensionUri],
		}

		// Provide initial React-based HTML for the webview
		view.webview.html = getHtmlForWebview(view.webview)

		// Listen for messages from the React webview
		setWebviewMessageListener(view.webview)
	}

	/**
	 * Cleans up and disposes of webview resources when the view is closed/unmounted.
	 */
	function dispose() {
		while (disposables.length) {
			const disposable = disposables.pop()
			if (disposable) {
				disposable.dispose()
			}
		}
	}

	/**
	 * If you want to inject a bundle directly, you could fetch it here and
	 * embed it. For now, we keep the same style as your React-starter approach.
	 */
	function getHtmlForWebview(webview: Webview) {
		const file = "src/index.tsx"
		const localPort = "5173"
		const localServerUrl = `localhost:${localPort}`

		const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"])

		let scriptUri: string | vscode.Uri
		const isProd = Extension.getInstance().isProductionMode
		if (isProd) {
			scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"])
		} else {
			scriptUri = `http://${localServerUrl}/${file}`
		}

		const nonce = getNonce()

		const reactRefresh = /*html*/ `
      <script type="module">
        import RefreshRuntime from "http://localhost:5173/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>`

		const reactRefreshHash = "sha256-YmMpkm5ow6h+lfI3ZRp0uys+EUCt6FOyLkJERkfVnTY="

		const csp = [
			`default-src 'none';`,
			`script-src 'unsafe-eval' https://* ${
				isProd
					? `'nonce-${nonce}'`
					: `http://${localServerUrl} http://0.0.0.0:${localPort} '${reactRefreshHash}'`
			}`,
			`style-src ${webview.cspSource} 'self' 'unsafe-inline' https://*`,
			`font-src ${webview.cspSource}`,
			`connect-src https://* ${
				isProd
					? ``
					: `ws://${localServerUrl} ws://0.0.0.0:${localPort} http://${localServerUrl} http://0.0.0.0:${localPort}`
			}`,
		]

		return /*html*/ `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp.join("; ")}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <title>VSCode React Starter</title>
      </head>
      <body>
        <div id="root"></div>
        ${isProd ? "" : reactRefresh}
        <script type="module" src="${scriptUri}"></script>
      </body>
    </html>`
	}

	/**
	 * This listens for messages sent from the React app (webview)
	 * via vscode.postMessage({ command: '...', ... }).
	 */
	function setWebviewMessageListener(webview: Webview) {
		webview.onDidReceiveMessage(
			async (message: any) => {
				console.log("Received message from webview:", message)
				const command = message.command

				switch (command) {
					case "hello":
						// Example from your existing code
						vscode.window.showInformationMessage(message.text)
						return

					case "updateBundle":
						// The shape of the message is presumably something like:
						// {
						//   command: 'updateBundle',
						//   bundle: {
						//     entityId: string,
						//     entity: 'variant' | 'message',
						//     newData?: {...}
						//   }
						// }
						await handleUpdateBundle(message)
						return

					default:
						console.log("Unknown command from webview:", command)
				}
			},
			undefined,
			disposables
		)
	}

	/**
	 * Replicates the logic from your old snippet's onDidReceiveMessage => updateBundle.
	 */
	async function handleUpdateBundle(message: UpdateBundleMessage) {
		try {
			if (!bundleId) {
				throw new Error("No bundleId set for this view.")
			}

			// 1. Re-fetch the "original" bundle
			const originalBundle = await getSelectedBundleByBundleIdOrAlias(bundleId)
			if (!originalBundle) {
				throw new Error(`Bundle with id ${bundleId} not found`)
			}

			// 2. Insert or delete data
			if (message.bundle.newData) {
				state()
					.project?.db.insertInto(message.bundle.entity)
					.values({
						...message.bundle.newData,
					})
					.onConflict((oc) =>
						oc.column("id").doUpdateSet({
							...message.bundle.newData,
						})
					)
					.execute()
			} else {
				// If no newData, remove it
				state()
					.project?.db.deleteFrom(message.bundle.entity)
					.where("id", "=", message.bundle.entityId)
					.execute()
			}

			// 3. Trigger your extension's events
			CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
			msg("Bundle updated successfully.")

			// Possibly re-render or do something else
			CONFIGURATION.EVENTS.ON_DID_EDITOR_VIEW_CHANGE.fire()
		} catch (e) {
			console.error(`Couldn't update bundle: ${e}`)
			msg(`Couldn't update bundle. ${String(e)}`, "error")
		}
	}

	/**
	 * Set or get the current bundleId from outside.
	 */
	function setBundleId(newBundleId: string) {
		bundleId = newBundleId
	}
	function getBundleId() {
		return bundleId
	}

	/**
	 * Return an object matching the `WebviewViewProvider` interface.
	 * We also expose setBundleId/getBundleId and dispose explicitly.
	 */
	return {
		resolveWebviewView,
		dispose,
		setBundleId,
		getBundleId,
	}
}
