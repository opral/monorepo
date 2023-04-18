import { LintRule, getLintReports } from "@inlang/core/lint"
import { useEditorState } from "../State.jsx"
import { For, createEffect, createSignal } from "solid-js"

interface ListHeaderProps {
	messageNo: number
}

type RuleSummaryItem = {
	id: string
	amount: number
	rule: LintRule
}

export const ListHeader = (props: ListHeaderProps) => {
	const { resources, inlangConfig, setFilteredLintRules } = useEditorState()
	const [newRuleSummary, setNewRuleSummary] = createSignal<Array<RuleSummaryItem>>([])

	const lintRuleIds = () =>
		inlangConfig()
			?.lint?.rules?.flat()
			.map((rule) => rule.id) ?? []

	createEffect(() => {
		if (resources) {
			const lintReports = getLintReports(resources)
			const newArr: Array<RuleSummaryItem> = []
			lintRuleIds().map((id) => {
				const filteredReports = lintReports.filter((report) => report.id === id)
				const lintRule = inlangConfig()
					?.lint?.rules.flat()
					.find((rule) => rule.id === id)
				if (lintRule && filteredReports) {
					newArr.push({ id, amount: filteredReports.length, rule: lintRule })
				}
			})
			setNewRuleSummary(newArr)
		}
	})

	return (
		<div class="h-14 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<div class="font-medium text-on-surface">{props.messageNo + " Messages"}</div>
			<div class="flex gap-2">
				<For each={newRuleSummary()}>
					{(rule) => (
						<sl-button prop:size="small" onClick={() => setFilteredLintRules([rule.rule["id"]])}>
							<div class="flex gap-2 items-center h-7">
								<div class="-ml-[4px] h-5 px-2 rounded bg-danger/10 flex items-center justify-center text-danger">
									{rule.amount}
								</div>
								<div class="text-xs text-on-surface-variant font-medium">{rule.id}</div>
							</div>
						</sl-button>
					)}
				</For>
			</div>
		</div>
	)
}
