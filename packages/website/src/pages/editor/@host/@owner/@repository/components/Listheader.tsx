import { LintRule, LintedMessage, getLintReports } from "@inlang/core/lint"
import { useEditorState } from "../State.jsx"
import { For, createEffect, createSignal } from "solid-js"
import type { Accessor } from "solid-js"

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
	const {
		resources,
		inlangConfig,
		setFilteredLintRules,
		filteredLintRules,
		filteredLanguages,
		textSearch,
	} = useEditorState()
	const [newRuleSummary, setNewRuleSummary] = createSignal<Array<RuleSummaryItem>>([])
	const [messageCount, setMessageCount] = createSignal<number>(0)

	const lintRuleIds = () =>
		inlangConfig()
			?.lint?.rules?.flat()
			.map((rule) => rule.id) ?? []

	//get lint summary values
	createEffect(() => {
		if (resources) {
			const filteredResources = resources
				.filter((resource) => filteredLanguages().includes(resource.languageTag.name))
				.filter((resource) =>
					textSearch() === ""
						? true
						: JSON.stringify(resource).toLowerCase().includes(textSearch().toLowerCase()),
				)
			const lintReports = getLintReports(filteredResources)
			const newArr: Array<RuleSummaryItem> = []
			lintRuleIds().map((id) => {
				const filteredReports = lintReports.filter((report) => report.id === id)
				const lintRule = inlangConfig()
					?.lint?.rules.flat()
					.find((rule) => rule.id === id)
				if (
					lintRule &&
					filteredReports &&
					(filteredLintRules().length === 0 || filteredLintRules().includes(lintRule.id))
				) {
					newArr.push({ id, amount: filteredReports.length, rule: lintRule })
				}
			})
			setNewRuleSummary(newArr)
		}
	})

	//calculate message conter
	createEffect(() => {
		let messageCounter = 0
		Object.values(props.messages()).map((message) => {
			let lintMatch = false
			if (filteredLintRules().length !== 0) {
				const messageWithLints = Object.values(message).filter((id) => id?.lint)
				messageWithLints.map((id) => {
					if (id?.lint?.some((lint) => filteredLintRules().includes(lint.id))) {
						lintMatch = true
					}
				})
			} else {
				lintMatch = true
			}

			let searchMatch = false
			if (textSearch() === "") {
				searchMatch = true
			} else {
				if (JSON.stringify(message).toLowerCase().includes(textSearch().toLowerCase())) {
					searchMatch = true
				}
			}
			//console.log(lintMatch + ", " + searchMatch)
			if (lintMatch && searchMatch) {
				messageCounter += 1
			}
		})
		setMessageCount(messageCounter)
	})

	return (
		<div class="h-14 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<div class="font-medium text-on-surface">{messageCount() + " Messages"}</div>
			<div class="flex gap-2">
				<For each={newRuleSummary()}>
					{(rule) => (
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
									{String(rule.id).slice(7)}
								</div>
							</div>
						</sl-button>
					)}
				</For>
			</div>
		</div>
	)
}
