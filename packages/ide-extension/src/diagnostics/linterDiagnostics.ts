import * as vscode from "vscode"
import { state } from "../utilities/state.js"
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

		const wrappedLints = (ideExtension.messageReferenceMatchers ?? []).map(async (matcher) => {
			const messages = await matcher({
				documentText: activeTextEditor.document.getText(),
			})

			const diagnosticsIndex: Record<string, Record<string, vscode.Diagnostic[]>> = {}

			for (const message of messages) {
				// resolve message from id or alias
				const _message =
					state().project.query.messages.get({
						where: { id: message.messageId },
					}) ?? state().project.query.messages.getByDefaultAlias(message.messageId)

				if (_message) {
					state().project.query.messages.get.subscribe(
						{
							where: {
								id: _message.id,
							},
						},
						async () => {
							const reports = await state().project.query.messageLintReports.get({
								where: { messageId: _message.id },
							})
							const diagnostics: vscode.Diagnostic[] = []

							if (!reports) {
								return
							}

							for (const report of reports) {
								const { level } = report

								const diagnosticRange = new vscode.Range(
									new vscode.Position(
										message.position.start.line - 1,
										message.position.start.character - 1
									),
									new vscode.Position(
										message.position.end.line - 1,
										message.position.end.character - 1
									)
								)

								// Get the lint message for the source language tag or fallback to "en"

								const lintMessage = typeof report.body === "object" ? report.body.en : report.body

								const diagnostic = new vscode.Diagnostic(
									diagnosticRange,
									`[${message.messageId}] – ${lintMessage}`,
									mapLintLevelToSeverity(level)
								)
								if (!diagnosticsIndex[message.messageId]) diagnosticsIndex[message.messageId] = {}
								// eslint-disable-next-line
								diagnosticsIndex[message.messageId]![getRangeIndex(diagnostic.range)] = diagnostics
								diagnostics.push(diagnostic)
							}

							if (reports.length === 0) {
								diagnosticsIndex[message.messageId] = {}
							}

							linterDiagnosticCollection.set(
								activeTextEditor.document.uri,
								flattenDiagnostics(diagnosticsIndex)
							)
						}
					)
				}
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
		args.context.subscriptions
	)

	// update lints when the text changes in a document
	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				updateLintDiagnostics()
			}
		},
		undefined,
		args.context.subscriptions
	)
}

function getRangeIndex(range: vscode.Diagnostic["range"]) {
	return `${range.start.line}${range.start.character}${range.end.line}${range.end.character}`
}

function flattenDiagnostics(
	index: Record<string, Record<string, vscode.Diagnostic[]>>
): vscode.Diagnostic[] {
	let result: vscode.Diagnostic[] = []

	const messageIds = Object.keys(index)

	for (const messageId of messageIds) {
		// eslint-disable-next-line
		result = [...result, ...Object.values(index[messageId]!).flat()]
	}

	return result
}
