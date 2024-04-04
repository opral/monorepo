import { useEditorState } from "../State.jsx"
import { For, Show, createSignal, createEffect, createMemo, createResource } from "solid-js"
import { TourHintWrapper } from "./Notification/TourHintWrapper.jsx"
import IconAdd from "~icons/material-symbols/add"
import { type InstalledMessageLintRule, type MessageLintRule } from "@inlang/sdk"
import { messageCount } from "../+Page.jsx"

export const ListHeader = () => {
	const {
		project,
		setFilteredMessageLintRules,
		filteredMessageLintRules,
		filteredLanguageTags,
		filteredIds,
		setTourStep,
		tourStep,
	} = useEditorState()

	const [getMessages, setMessages] = createSignal()

	createEffect(() => {
		if (!project.loading) {
			const messages = project()!.query.messages.getAll()
			setMessages(messages)
		}
	})

	// createResource re-fetches lintReports via async api whenever messages change
	const [lintReports] = createResource(getMessages, async () => {
		const reports = await project()!.query.messageLintReports.getAll()
		return reports
	})

	const getLintSummary = createMemo(() => {
		const summary = new Map<string, number>() // Use a Map with explicit types for better performance
		const filteredRules = new Set<string>(filteredMessageLintRules())
		const filteredTags = new Set<string>(filteredLanguageTags())
		const filteredIdsValue = filteredIds()

		for (const report of lintReports() || []) {
			const ruleId = report.ruleId
			const languageTag = report.languageTag
			const messageId = report.messageId

			if (
				(filteredRules.size === 0 || filteredRules.has(ruleId)) &&
				(filteredTags.size === 0 || filteredTags.has(languageTag)) &&
				(filteredIdsValue.length === 0 || filteredIdsValue.includes(messageId))
			) {
				summary.set(ruleId, (summary.get(ruleId) || 0) + 1)
			}
		}

		// Convert the Map to a plain object before returning
		const summaryObject: { [key: string]: number } = {}
		for (const [ruleId, count] of summary) {
			summaryObject[ruleId] = count
		}

		return summaryObject
	})

	const getLintRule = (lintRuleId: MessageLintRule["id"]): InstalledMessageLintRule | undefined =>
		project()
			?.installed.messageLintRules()
			.find((rule) => rule.id === lintRuleId)

	return (
		<div class="w-full bg-background border border-surface-3 rounded-t-md flex flex-wrap items-center justify-between gap-2 p-4 animate-blendIn z-[1] relative">
			<div class="font-medium text-on-surface">{messageCount() + " Messages"}</div>
			<div class="flex flex-wrap gap-2">
				<For each={Object.keys(getLintSummary()) as MessageLintRule["id"][]}>
					{(lintRule) => (
						<Show when={getLintSummary()[lintRule] !== 0}>
							<TourHintWrapper
								currentId="missing-translation-rule"
								position="bottom-right"
								offset={{ x: 0, y: 40 }}
								isVisible={
									lintRule === "messageLintRule.inlang.missingTranslation" &&
									tourStep() === "missing-translation-rule"
								}
							>
								<sl-tooltip
									prop:content={
										typeof getLintRule(lintRule)?.description === "object"
											? // @ts-ignore
											  getLintRule(lintRule)?.description.en
											: getLintRule(lintRule)?.description
									}
									prop:placement="bottom"
									prop:trigger="hover"
									class="small"
									style={{ "--show-delay": "1s" }}
								>
									<sl-button
										prop:size="small"
										class={
											filteredMessageLintRules()?.includes(lintRule || "")
												? getLintRule(lintRule)!.level === "warning"
													? "ring-warning/20 ring-1 rounded animate-blendIn"
													: "ring-danger/20 ring-1 rounded animate-blendIn"
												: "animate-blendIn"
										}
										onClick={() => {
											if (filteredMessageLintRules().includes(lintRule)) {
												setFilteredMessageLintRules(
													filteredMessageLintRules().filter((id) => id !== lintRule)
												)
											} else {
												setFilteredMessageLintRules([lintRule])
												setTourStep("textfield")
											}
										}}
									>
										<div
											class="flex gap-2 items-center h-7"
											id={
												lintRule === "messageLintRule.inlang.missingTranslation"
													? "missingTranslation-summary"
													: "lint-summary"
											}
										>
											<div class="-ml-[4px] h-5 rounded">
												<div
													class={
														getLintRule(lintRule)?.level === "warning"
															? " text-focus-warning bg-warning/20 h-full px-2 rounded flex items-center justify-center"
															: "text-focus-danger bg-danger/20 h-full px-2 rounded flex items-center justify-center"
													}
												>
													{getLintSummary()[lintRule]}
												</div>
											</div>

											<div class="text-xs text-on-surface-variant font-medium">
												{typeof getLintRule(lintRule)?.displayName === "object"
													? // @ts-ignore
													  getLintRule(lintRule)?.displayName.en
													: getLintRule(lintRule)?.displayName}
											</div>
										</div>
									</sl-button>
								</sl-tooltip>
							</TourHintWrapper>
						</Show>
					)}
				</For>
				<TourHintWrapper
					currentId="missing-lint-rules"
					position="bottom-right"
					offset={{ x: 0, y: 40 }}
					isVisible={tourStep() === "missing-lint-rules"}
				>
					<sl-tooltip
						prop:content={
							"Install lint rules from the marketplace. They will help you write better translations."
						}
						prop:placement="bottom"
						prop:trigger="hover"
						style={{ "--show-delay": "1s" }}
					>
						<sl-button
							prop:size="small"
							prop:href={
								import.meta.env.PROD
									? "https://inlang.com/c/lint-rules"
									: "http://localhost:3000/c/lint-rules"
							}
							prop:target="_blank"
						>
							<Show
								when={
									project()?.installed.messageLintRules().length === 0 ||
									project()?.query.messages.includedMessageIds().length === 0
								}
							>
								Install lint rules
							</Show>
							<Show when={project()?.installed.messageLintRules().length !== 0}>
								{/* @ts-ignore */}
								<IconAdd slot="prefix" class="w-5 h-5 -mx-1" />
							</Show>
						</sl-button>
					</sl-tooltip>
				</TourHintWrapper>
			</div>
		</div>
	)
}
