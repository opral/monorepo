import * as vscode from "vscode"
import { state } from "../state.js"
import type { MessageLintReport } from "@inlang/sdk"
import { getActiveTextEditor } from "../utilities/initProject.js"

export async function linterDiagnostics(args: { context: vscode.ExtensionContext }) {
	const linterDiagnosticCollection = vscode.languages.createDiagnosticCollection("inlang-lint")

	async function updateLintDiagnostics() {
		const activeTextEditor = getActiveTextEditor()
		if (!activeTextEditor) {
			return
		}

		const ideExtension = state().project.customApi()["app.inlang.ideExtension"]

		if (!ideExtension) {
			return
		}

		const wrappedLints = (ideExtension.messageReferenceMatchers ?? []).map(async (matcher) => {
			const messages = await matcher({
				documentText: activeTextEditor.document.getText(),
			})

			const diagnosticsIndex: Record<string, vscode.Diagnostic[]> = {}

			for (const message of messages) {
				state().project.query.messageLintReports.get.subscribe(
					{
						where: {
							messageId: message.messageId,
						},
					},
					(reports) => {
						const diagnostics: vscode.Diagnostic[] = []

						if (!reports) {
							return
						}

						for (const report of reports) {
							const { level } = report

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

							// Get the lint message for the source language tag or fallback to "en"

							const lintMessage = typeof report.body === "object" ? report.body.en : report.body

							const diagnostic = new vscode.Diagnostic(
								diagnosticRange,
								`[${message.messageId}] – ${lintMessage}`,
								mapLintLevelToSeverity(level),
							)
							diagnostics.push(diagnostic)
						}

						diagnosticsIndex[message.messageId] = diagnostics
						linterDiagnosticCollection.set(
							activeTextEditor.document.uri,
							Object.values(diagnosticsIndex).flat(),
						)
					},
				)
			}
		})

		await Promise.all(wrappedLints || [])

		// Set all the collected diagnostics at once
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
			if (event.document === getActiveTextEditor()?.document) {
				updateLintDiagnostics()
			}
		},
		undefined,
		args.context.subscriptions,
	)
}
