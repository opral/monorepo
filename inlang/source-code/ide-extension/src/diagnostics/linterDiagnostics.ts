import * as vscode from "vscode"
import { state } from "../state.js"
import type { MessageLintReport } from "@inlang/sdk"

export async function linterDiagnostics(args: { context: vscode.ExtensionContext }) {
	const linterDiagnosticCollection = vscode.languages.createDiagnosticCollection("inlang-lint")

	async function updateLintDiagnostics() {
		const activeTextEditor = vscode.window.activeTextEditor
		if (!activeTextEditor) {
			return
		}

		const ideExtension = state().project.customApi()["app.inlang.ideExtension"]

		if (!ideExtension) {
			return
		}

		const diagnostics: vscode.Diagnostic[] = []

		const wrappedLints = (ideExtension.messageReferenceMatchers ?? []).map(async (matcher) => {
			const messages = await matcher({
				documentText: activeTextEditor.document.getText(),
			})
			for (const message of messages) {
				const matchingLintReports =
					state().project.query.messageLintReports.get({
						where: {
							messageId: message.messageId,
						},
					}) || []

				for (const report of matchingLintReports) {
					const { level } = report

					const diagnosticRange = new vscode.Range(
						new vscode.Position(
							message.position.start.line - 1,
							message.position.start.character - 1,
						),
						new vscode.Position(message.position.end.line - 1, message.position.end.character - 1),
					)

					// Get the lint message for the source language tag or fallback to "en"

					const lintMessage = typeof report.body === "object" ? report.body.en : report.body

					const diagnostic = new vscode.Diagnostic(
						diagnosticRange,
						`[${message.messageId}] – ${lintMessage}`,
						mapLintLevelToSeverity(level),
					)

					diagnostics.push(diagnostic)
				}
			}
		})

		await Promise.all(wrappedLints || [])

		// Set all the collected diagnostics at once
		linterDiagnosticCollection.set(activeTextEditor.document.uri, diagnostics)
	}

	function mapLintLevelToSeverity(level: MessageLintReport["level"]): vscode.DiagnosticSeverity {
		if (level === "error") {
			return vscode.DiagnosticSeverity.Error
		} else if (level === "warning") {
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
