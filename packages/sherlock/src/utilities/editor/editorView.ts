import * as vscode from "vscode"
import type { Disposable, WebviewPanel } from "vscode"

import { getUri } from "./helper/getUri.js"
import { getNonce } from "./helper/getNonce.js"
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { getSelectedBundleByBundleIdOrAlias } from "../helper.js"
import { msg } from "../messages/msg.js"
import type { ChangeEventDetail } from "@inlang/editor-component"

// Same interface as before
interface UpdateBundleMessage {
	command: string
	change: ChangeEventDetail
}

/**
 * An ID you can use to differentiate panels in VS Code.
 * (Doesn't have to match the old 'editorView' if you don't want.)
 */
export const EDITOR_PANEL_ID = "editorViewPanel"

/**
 * Creates or reveals a regular WebviewPanel (like an editor tab),
 * instead of a side-view via WebviewViewProvider.
 *
 * All your bundle/update logic remains the same.
 */
export function editorView(args: { context: vscode.ExtensionContext; initialBundleId: string }) {
	const { context, initialBundleId } = args
	const extensionUri = context.extensionUri

	let panel: WebviewPanel | undefined
	let disposables: Disposable[] = []
	let bundleId = initialBundleId

	/**
	 * Opens a new panel if none is open, otherwise reveals the existing one.
	 */
	async function createOrShowPanel() {
		if (panel) {
			// If we already have a panel, reveal it
			panel.reveal(vscode.ViewColumn.One)
			return
		}

		// Otherwise, create a brand-new panel
		panel = vscode.window.createWebviewPanel(
			EDITOR_PANEL_ID,
			"Editor Panel",
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			}
		)

		// Set up disposal
		panel.onDidDispose(
			() => {
				dispose()
				panel = undefined
			},
			null,
			disposables
		)

		// Listen to panel and load state when it's visible
		panel.onDidChangeViewState(
			async (e) => {
				if (e.webviewPanel.visible) {
					panel?.webview.postMessage({
						command: "change",
						data: {
							bundle: await getSelectedBundleByBundleIdOrAlias(bundleId),
							settings: await state().project?.settings.get(),
						},
					})
				}
			},
			null,
			disposables
		)

		// Provide the same HTML you had before
		panel.webview.html = getHtmlForWebview(panel.webview)

		// Set initial data
		panel.webview.postMessage({
			command: "change",
			data: {
				bundle: await getSelectedBundleByBundleIdOrAlias(bundleId),
				settings: await state().project?.settings.get(),
			},
		})

		// Set up the same message listener logic
		setWebviewMessageListener(panel.webview)
	}

	/**
	 * The same message handler logic you used in your snippet,
	 * listening for 'updateBundle' etc.
	 */
	function setWebviewMessageListener(webview: vscode.Webview) {
		const disposable = webview.onDidReceiveMessage(async (message: any) => {
			const command = message.command

			switch (command) {
				case "change":
					await handleUpdateBundle(message)
					return

				default:
					console.log("Unknown command from webview:", command)
			}
		})
		disposables.push(disposable)
	}

	/**
	 * The same update logic from your original snippet.
	 */
	async function handleUpdateBundle(message: UpdateBundleMessage) {
		console.log("handleUpdateBundle", message)
		try {
			if (!bundleId) {
				throw new Error("No bundleId set for this view.")
			}

			const originalBundle = await getSelectedBundleByBundleIdOrAlias(bundleId)
			if (!originalBundle) {
				throw new Error(`Bundle with id ${bundleId} not found`)
			}

			const { change } = message

			if (change.newData) {
				state()
					.project?.db.insertInto(change.entity)
					.values({
						...change.newData,
						// @ts-expect-error - we need to remove the nesting
						messages: undefined,
						variants: undefined,
					})
					.onConflict((oc) =>
						oc.column("id").doUpdateSet({
							...change.newData,
							// @ts-expect-error - we need to remove the nesting
							messages: undefined,
							variants: undefined,
						})
					)
					.execute()

				// Check if the change involves adding a new variant or selector
				if (change.entity === "variant") {
					panel?.webview.postMessage({
						command: "change",
						data: {
							bundle: await getSelectedBundleByBundleIdOrAlias(bundleId),
							settings: await state().project?.settings.get(),
						},
					})
				}
			} else {
				state().project?.db.deleteFrom(change.entity).where("id", "=", change.entityId).execute()
			}

			CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
			CONFIGURATION.EVENTS.ON_DID_EDITOR_VIEW_CHANGE.fire()
		} catch (e) {
			console.error(`Couldn't update bundle: ${e}`)
			msg(`Couldn't update bundle. ${String(e)}`, "error")
		}
	}

	/**
	 * Your original logic for generating the HTML,
	 * including dev vs. prod, React Refresh, etc.
	 */
	function getHtmlForWebview(webview: vscode.Webview) {
		const file = "src/main.tsx"
		const localPort = "5173"
		const localServerUrl = `localhost:${localPort}`

		const stylesUri = getUri(webview, extensionUri, [
			"src",
			"utilities",
			"editor",
			"sherlock-editor-app",
			"build",
			"assets",
			"index.css",
		])

		let scriptUri: string | vscode.Uri
		const isProd = context.extensionMode === vscode.ExtensionMode.Production
		if (isProd) {
			scriptUri = getUri(webview, extensionUri, [
				"src",
				"utilities",
				"editor",
				"sherlock-editor-app",
				"build",
				"assets",
				"index.js",
			])
		} else {
			scriptUri = `http://${localServerUrl}/${file}`
		}

		const nonce = getNonce()

		// The dev-time React Refresh snippet
		const reactRefresh = /*html*/ `
      <script type="module">
        import RefreshRuntime from "http://localhost:5173/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>`

		const reactRefreshHash = "sha256-YmMpkm5ow6h+lfI3ZRp0uys+EUCt6FOyLkJERkfVnTY="

		// CSP
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
	 * Let external code update the bundleId if desired
	 */
	function setBundleId(newBundleId: string) {
		bundleId = newBundleId
	}

	function getBundleId() {
		return bundleId
	}

	/**
	 * Dispose any event listeners or watchers
	 */
	function dispose() {
		while (disposables.length) {
			const disposable = disposables.pop()
			if (disposable) disposable.dispose()
		}
	}

	/**
	 * Return an object with methods to show the panel,
	 * set the bundleId, etc.
	 */
	return {
		createOrShowPanel,
		setBundleId,
		getBundleId,
		dispose,
	}
}
