import { LintRule, LintedMessage, getLintReports } from "@inlang/core/lint"
import { useEditorState } from "../State.jsx"
import { For, Show } from "solid-js"
import type { Accessor } from "solid-js"
import { showFilteredMessage } from "./../helper/showFilteredMessage.js"
import { TourHintWrapper } from "./Notification/TourHintWrapper.jsx"
import { handleMissingMessage } from "../helper/handleMissingMessage.js"
import IconArrowLeft from "~icons/material-symbols/arrow-back-rounded"

interface ListHeaderProps {
	messages: Accessor<{
		[id: string]: {
			[language: string]: LintedMessage | undefined
		}
	}>
}

type RuleSummaryItem = {
	id: string
	amount: number
	rule: LintRule
	level: "warn" | "error"
}

export const messageCount = (
	messages: Accessor<{
		[id: string]: {
			[language: string]: LintedMessage | undefined
		}
	}>,
	filteredLanguages: string[],
	textSearch: string,
	filteredLintRules: `${string}.${string}`[],
	messageId: string,
) => {
	let counter = 0
	for (const id of Object.keys(messages())) {
		if (
			showFilteredMessage(
				messages()[id]!,
				filteredLanguages,
				textSearch,
				filteredLintRules,
				messageId,
			).length > 0
		) {
			counter++
		}
	}
	return counter
}

export const ListHeader = (props: ListHeaderProps) => {
	const {
		inlangConfig,
		setFilteredLintRules,
		filteredLintRules,
		filteredLanguages,
		filteredId,
		setFilteredId,
		textSearch,
		setTourStep,
		tourStep,
	} = useEditorState()

	const lintRuleIds = () =>
		inlangConfig()
			?.lint?.rules?.flat()
			.map((rule) => rule.id) ?? []

	const getLintSummary = () => {
		const lintSummary: Array<RuleSummaryItem> = []

		// loop over lints
		lintRuleIds().map((lintId) => {
			const lintRule = inlangConfig()
				?.lint?.rules.flat()
				.find((rule) => rule.id === lintId)
			// loop over messages
			let counter = 0
			for (const id of Object.keys(props.messages())) {
				const filteredReports = getLintReports(
					showFilteredMessage(
						props.messages()[id]!,
						filteredLanguages(),
						textSearch(),
						[lintId],
						filteredId(),
					) as LintedMessage[],
				).filter((report) => handleMissingMessage(report, filteredLanguages()))
				counter += filteredReports.length
			}
			if (
				lintRule &&
				counter !== 0 &&
				(filteredLintRules().length === 0 || filteredLintRules().includes(lintRule.id))
			) {
				lintSummary.push({ id: lintId, amount: counter, rule: lintRule!, level: lintRule.level })
			}
		})
		return lintSummary
	}

	return (
		<div class="h-14 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<Show
				when={filteredId() === ""}
				fallback={
					<div class="flex gap-2 items-center">
						<sl-button prop:size="small" onClick={() => setFilteredId("")}>
							<IconArrowLeft slot="prefix" />
							Back to all messages
						</sl-button>
						<div class="h-[30px] px-3 flex gap-2 font-medium items-center rounded-md text-xs bg-hover-primary/10 text-primary">
							Isolated view (single ID)
						</div>
					</div>
				}
			>
				<div class="font-medium text-on-surface">
					{messageCount(
						props.messages,
						filteredLanguages(),
						textSearch(),
						filteredLintRules(),
						filteredId(),
					) + " Messages"}
				</div>
			</Show>

			<div class="flex gap-2">
				<For each={getLintSummary()}>
					{(rule) => (
						<Show when={rule.amount !== 0}>
							<TourHintWrapper
								currentId="missing-message-rule"
								position="bottom-right"
								offset={{ x: 0, y: 40 }}
								isVisible={
									(rule.id.includes(".")
										? String(rule.id.split(".")[1]!) === "missingMessage"
										: String(rule.id) === "missingMessage") && tourStep() === "missing-message-rule"
								}
							>
								<sl-button
									prop:size="small"
									class={
										filteredLintRules().includes(rule.rule["id"])
											? rule.level === "warn"
												? "ring-warning/20 ring-1 rounded"
												: "ring-danger/20 ring-1 rounded"
											: ""
									}
									onClick={() => {
										if (filteredLintRules().includes(rule.rule["id"])) {
											setFilteredLintRules(
												filteredLintRules().filter((id) => id !== rule.rule["id"]),
											)
										} else {
											setFilteredLintRules([rule.rule["id"]])
											setTourStep("textfield")
										}
									}}
								>
									<div
										class="flex gap-2 items-center h-7"
										id={
											(
												rule.id.includes(".")
													? String(rule.id.split(".")[1]!) === "missingMessage"
													: String(rule.id) === "missingMessage"
											)
												? "missingMessage-summary"
												: "lint-summary"
										}
									>
										<div class="-ml-[4px] h-5 rounded">
											<div
												class={
													rule.rule.level === "warn"
														? " text-focus-warning bg-warning/20 h-full px-2 rounded flex items-center justify-center"
														: "text-focus-danger bg-danger/20 h-full px-2 rounded flex items-center justify-center"
												}
											>
												{rule.amount}
											</div>
										</div>

										<div class="text-xs text-on-surface-variant font-medium">
											{rule.id.includes(".") ? String(rule.id.split(".")[1]!) : String(rule.id)}
										</div>
									</div>
								</sl-button>
							</TourHintWrapper>
						</Show>
					)}
				</For>
			</div>
		</div>
	)
}
