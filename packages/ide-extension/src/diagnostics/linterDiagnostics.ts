import { getLintReports, lint, LintReport } from "@inlang/core/lint"
import * as vscode from "vscode"
import { state } from "../state.js"
import structuredClonePolyfill from "@ungap/structured-clone"

// polyfilling node < 17 with structuredClone
if (typeof structuredClone === "undefined") {
	;(globalThis as any).structuredClone = structuredClonePolyfill
}

export async function linterDiagnostics(args: { context: vscode.ExtensionContext }) {
	const linterDiagnosticCollection = vscode.languages.createDiagnosticCollection("inlang-lint")

	async function updateLintDiagnostics() {
		const activeTextEditor = vscode.window.activeTextEditor
		if (!activeTextEditor) {
			return
		}

		const resources = state().resources

		const [resourcesWithLints, errors] = await lint({ resources, config: state().config })

		if (errors) {
			console.error(errors)
		}

		// Use `getLintReports` to get lint reports
		const lintReports = getLintReports(resourcesWithLints)

		const diagnostics: vscode.Diagnostic[] = []

		const wrappedLints = (state().config.ideExtension?.messageReferenceMatchers ?? []).map(
			async (matcher) => {
				const messages = await matcher({
					documentText: activeTextEditor.document.getText(),
				})
				for (const message of messages) {
					// TODO: Can be improved with lintReport exposing the messageId
					const matchingLintReports = lintReports.filter((lintReport) =>
						lintReport.message.includes(message.messageId),
					)

					for (const lintReport of matchingLintReports) {
						const { level } = lintReport

						const diagnosticRange = new vscode.Range(
							new vscode.Position(
								message.position.start.line - 1,
								message.position.start.character - 1,
							),
							new vscode.Position(
								message.position.end.line - 1,
								message.position.end.character - 1,
							),
						)

						const diagnostic = new vscode.Diagnostic(
							diagnosticRange,
							"[" + message.messageId + "] – " + lintReport.message,
							mapLintLevelToSeverity(level),
						)

						diagnostics.push(diagnostic)
					}
				}
			},
		)

		await Promise.all(wrappedLints || [])

		// Set all the collected diagnostics at once
		linterDiagnosticCollection.set(activeTextEditor.document.uri, diagnostics)
	}

	function mapLintLevelToSeverity(level: LintReport["level"]): vscode.DiagnosticSeverity {
		if (level === "error") {
			return vscode.DiagnosticSeverity.Error
		} else if (level === "warn") {
			return vscode.DiagnosticSeverity.Warning
		}
		return vscode.DiagnosticSeverity.Error
	}

	// in case the active text editor is already open, update lints
	updateLintDiagnostics()

	// immediately update lints when the active text editor changes
	vscode.window.onDidChangeActiveTextEditor(
		() => updateLintDiagnostics(),
		undefined,
		args.context.subscriptions,
	)

	// update lints when the text changes in a document
	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				updateLintDiagnostics()
			}
		},
		undefined,
		args.context.subscriptions,
	)
}
