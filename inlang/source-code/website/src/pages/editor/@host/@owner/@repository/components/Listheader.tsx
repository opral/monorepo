import { useEditorState } from "../State.jsx"
import { For, Show, createMemo } from "solid-js"
import { showFilteredMessage } from "./../helper/showFilteredMessage.js"
import { TourHintWrapper } from "./Notification/TourHintWrapper.jsx"
import IconArrowLeft from "~icons/material-symbols/arrow-back-rounded"
import { type InstalledMessageLintRule, type MessageLintRule } from "@inlang/sdk"
import { navigate } from "vite-plugin-ssr/client/router"

interface ListHeaderProps {
	ids: string[]
}

export const messageCount = (ids: string[]) => {
	const { project } = useEditorState()
	let counter = 0
	for (const id of ids) {
		if (showFilteredMessage(project()?.query.messages.get({ where: { id: id } }))) counter++
	}
	return counter
}

export const ListHeader = (props: ListHeaderProps) => {
	const {
		project,
		setFilteredMessageLintRules,
		filteredMessageLintRules,
		filteredLanguageTags,
		filteredId,
		setFilteredId,
		setTourStep,
		tourStep,
	} = useEditorState()

	const getLintSummary = createMemo(() => {
		const summary: Record<MessageLintRule["id"], number> = {}
		for (const report of project()?.query.messageLintReports.getAll() || []) {
			if (
				((filteredMessageLintRules().length === 0 ||
					filteredMessageLintRules().includes(report.ruleId)) &&
					(filteredLanguageTags().length === 0 ||
						filteredLanguageTags().includes(report.languageTag)) &&
					filteredId() === "") ||
				filteredId() === report.messageId
			) {
				summary[report.ruleId] = (summary[report.ruleId] || 0) + 1
			}
		}
		return summary
	})

	const getLintRule = (lintRuleId: MessageLintRule["id"]): InstalledMessageLintRule | undefined =>
		project()
			?.installed.messageLintRules()
			.find((rule) => rule.id === lintRuleId)

	return (
		<div class="h-14 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<Show
				when={filteredId() === ""}
				fallback={
					<div class="flex gap-2 items-center">
						<sl-button prop:size="small" onClick={() => setFilteredId("")}>
							{/* @ts-ignore */}
							<IconArrowLeft slot="prefix" />
							Back to all messages
						</sl-button>
						<div class="h-[30px] px-3 flex gap-2 font-medium items-center rounded-md text-xs bg-hover-primary/10 text-primary">
							Isolated view (single ID)
						</div>
					</div>
				}
			>
				<div class="font-medium text-on-surface">{messageCount(props.ids) + " Messages"}</div>
			</Show>

			<div class="flex gap-2">
				<For each={Object.keys(getLintSummary()) as MessageLintRule["id"][]}>
					{(lintRule) => (
						<Show when={getLintSummary()[lintRule] !== 0}>
							<TourHintWrapper
								currentId="missing-translation-rule"
								position="bottom-end"
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
													? "ring-warning/20 ring-1 rounded"
													: "ring-danger/20 ring-1 rounded"
												: ""
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
											<div class="-ms-[4px] h-5 rounded">
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
				<Show when={project()?.installed.messageLintRules().length === 0}>
					<TourHintWrapper
						currentId="missing-lint-rules"
						position="bottom-end"
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
								// @ts-ignore
								onClick={() => navigate("/marketplace")}
							>
								Install lint rules
							</sl-button>
						</sl-tooltip>
					</TourHintWrapper>
				</Show>
			</div>
		</div>
	)
}
