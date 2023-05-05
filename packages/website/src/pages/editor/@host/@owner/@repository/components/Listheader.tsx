import type { LintRule, LintedMessage } from "@inlang/core/lint"
import { useEditorState } from "../State.jsx"
import { For, Show } from "solid-js"
import type { Accessor } from "solid-js"
import { showFilteredMessage } from "@src/pages/editor/utils/showFilteredMessage.js"

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
}

export const ListHeader = (props: ListHeaderProps) => {
	const { inlangConfig, setFilteredLintRules, filteredLintRules, filteredLanguages, textSearch } =
		useEditorState()

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
				if (
					showFilteredMessage(props.messages()[id]!, filteredLanguages(), textSearch(), [lintId])
				) {
					counter++
				}
			}
			if (
				lintRule &&
				counter !== 0 &&
				(filteredLintRules().length === 0 || filteredLintRules().includes(lintRule.id))
			) {
				lintSummary.push({ id: lintId, amount: counter, rule: lintRule! })
			}
		})
		return lintSummary
	}

	const messageCount = () => {
		let counter = 0
		for (const id of Object.keys(props.messages())) {
			if (
				showFilteredMessage(
					props.messages()[id]!,
					filteredLanguages(),
					textSearch(),
					filteredLintRules(),
				)
			) {
				counter++
			}
		}
		return counter
	}

	return (
		<div class="h-14 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<div class="font-medium text-on-surface">{messageCount() + " Messages"}</div>
			<div class="flex gap-2">
				<For each={getLintSummary()}>
					{(rule) => (
						<Show when={rule.amount !== 0}>
							<sl-button prop:size="small" onClick={() => setFilteredLintRules([rule.rule["id"]])}>
								<div class="flex gap-2 items-center h-7">
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
						</Show>
					)}
				</For>
			</div>
		</div>
	)
}
