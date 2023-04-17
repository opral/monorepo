import { getLintReports } from "@inlang/core/lint"
import { useEditorState } from "../State.jsx"
import { For, createEffect, createSignal } from "solid-js"

interface ListHeaderProps {
	messageNo: number
}

type RuleSummaryItem = {
	id: string
	amount: number
}

export const ListHeader = (props: ListHeaderProps) => {
	const { resources, inlangConfig } = useEditorState()
	const lintReports = getLintReports(resources)
	const [newRuleSummary, setNewRuleSummary] = createSignal<Array<RuleSummaryItem>>([])

	const lintRuleIds = () =>
		inlangConfig()
			?.lint?.rules?.flat()
			.map((rule) => rule.id) ?? []

	createEffect(() => {
		const newArr: Array<RuleSummaryItem> = []
		lintRuleIds().map((id) => {
			const filteredReports = lintReports.filter((report) => report.id === id)
			newArr.push({ id, amount: filteredReports.length })
		})
		setNewRuleSummary(newArr)
	})

	return (
		<div class="h-14 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<div class="font-medium text-on-surface">{props.messageNo + " Messages"}</div>
			<div class="flex gap-2">
				<For each={newRuleSummary()}>
					{(rule) => (
						<sl-button prop:size="small">
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
