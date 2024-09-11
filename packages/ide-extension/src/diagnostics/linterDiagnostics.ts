/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as vscode from "vscode"
import { resolveLintRules } from "./lintRuleResolver.js"
import { state } from "../utilities/state.js"
import { selectBundleNested } from "@inlang/sdk2"
import type { FileSystem } from "../utilities/fs/createFileSystemMapper.js"
import { type IdeExtensionConfig } from "@inlang/sdk2"

export async function linterDiagnostics(args: {
	context: vscode.ExtensionContext
	fs: FileSystem
}) {
	const linterDiagnosticCollection = vscode.languages.createDiagnosticCollection("inlang-lint")

	async function updateLintDiagnostics() {
		const activeTextEditor = vscode.window.activeTextEditor
		if (!activeTextEditor) return

		const documentText = activeTextEditor.document.getText()

		// Retrieve IDE Extension Config
		const ideExtension = (await state().project.plugins.get()).find(
			(plugin) => plugin?.meta?.["app.inlang.ideExtension"]
		)?.meta?.["app.inlang.ideExtension"] as IdeExtensionConfig | undefined

		if (!ideExtension) return

		// Process messageReferenceMatchers to match bundles
		const messageReferenceMatchers = ideExtension.messageReferenceMatchers ?? []
		const activeLintRules = await resolveLintRules()
		const diagnostics: vscode.Diagnostic[] = []

		// Run each matcher on the document text
		const wrappedLints = messageReferenceMatchers.map(async (matcher) => {
			const bundles = await matcher({ documentText })

			const diagnosticsIndex: Record<string, Record<string, vscode.Diagnostic[]>> = {}

			for (const bundle of bundles) {
				// Retrieve the bundle and messages
				const _bundle = await selectBundleNested(state().project.db)
					.where((eb) =>
						eb.or([
							eb("id", "=", bundle.bundleId),
							eb(eb.ref("alias", "->").key("default"), "=", bundle.bundleId),
						])
					)
					.execute()

				if (_bundle) {
					for (const lintRule of activeLintRules) {
						const lintResults = await lintRule.ruleFn(bundle.bundleId)

						for (const result of lintResults) {
							const diagnosticRange = new vscode.Range(
								new vscode.Position(0, 0), // Adjust based on actual range from matcher
								new vscode.Position(0, 1)
							)

							const diagnostic = new vscode.Diagnostic(
								diagnosticRange,
								`[${result.code}] - ${result.description}`,
								result.severity
							)

							// Create index for diagnostics if missing
							if (!diagnosticsIndex[bundle.bundleId]) {
								diagnosticsIndex[bundle.bundleId] = {}
							}

							// Store the diagnostics
							const rangeIndex = getRangeIndex(diagnostic.range)
							if (!diagnosticsIndex[bundle.bundleId]![rangeIndex]) {
								diagnosticsIndex[bundle.bundleId]![rangeIndex] = []
							}
							// Typescript doesn't understand that diagnosticsIndex[bundle.bundleId]![rangeIndex] is an empty array if it doesn't exist
							// @ts-expect-error
							diagnosticsIndex[bundle.bundleId]![rangeIndex].push(diagnostic)
						}
					}
				}
			}

			// Collect all diagnostics
			diagnostics.push(...flattenDiagnostics(diagnosticsIndex))
		})

		await Promise.all(wrappedLints || [])

		// Set all the collected diagnostics at once
		linterDiagnosticCollection.set(activeTextEditor.document.uri, diagnostics)
	}

	// Trigger diagnostics on active text editor change and text document change
	vscode.window.onDidChangeActiveTextEditor(
		updateLintDiagnostics,
		undefined,
		args.context.subscriptions
	)
	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				updateLintDiagnostics()
			}
		},
		undefined,
		args.context.subscriptions
	)

	// Run diagnostics on initial load
	updateLintDiagnostics()
}

// Helper function to get a unique index for a range
function getRangeIndex(range: vscode.Diagnostic["range"]) {
	return `${range.start.line}${range.start.character}${range.end.line}${range.end.character}`
}

// Helper function to flatten diagnostics into an array
function flattenDiagnostics(
	index: Record<string, Record<string, vscode.Diagnostic[]>>
): vscode.Diagnostic[] {
	let result: vscode.Diagnostic[] = []

	const messageIds = Object.keys(index)

	for (const messageId of messageIds) {
		result = [...result, ...Object.values(index[messageId]!).flat()]
	}

	return result
}
