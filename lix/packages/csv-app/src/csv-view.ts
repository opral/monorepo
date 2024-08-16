import { html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { Task } from "@lit/task"
import Papa from "papaparse"
import { classMap } from "lit/directives/class-map.js"
import { repeat } from "lit/directives/repeat.js"
import { poll } from "./reactivity"
import { Change, Commit } from "@lix-js/sdk"
import { BaseElement } from "./baseElement"
import { jsonObjectFrom } from "@lix-js/sdk"

// @ts-nocheck

@customElement("csv-view")
export class CsvView extends BaseElement {
	lix: any
	openFile: any
	parseCsvTask = new Task(this, {
		args: () => [],
		task: async () => {
			const result = await this.lix?.db
				.selectFrom("file")
				.select(["id", "data"])
				.where("path", "=", this.openFile!)
				.executeTakeFirstOrThrow()
			this.fileId = result!.id
			const decoder = new TextDecoder()
			const str = decoder.decode(result!.data)
			return Papa.parse(str, { header: true })
		},
	})

	// ugly workaround to get the task to re-run once
	// another file has been selected
	connectedCallback(): void {
		// @ts-ignore
		super.connectedCallback()
		// this.openFile.subscribe(() => this.parseCsvTask.run());

		poll(
			async () => {
				if (this.fileId === undefined) {
					return undefined
				}
				const uncommittedChanges = await this.lix?.db
					.selectFrom("change")
					.selectAll()
					.where("file_id", "=", this.fileId)
					.where("commit_id", "is", null)
					.execute()

				const conflicts = []
				// await this.lix?.db
				// 	.selectFrom("change")
				// 	.selectAll()
				// 	.where("file_id", "=", this.fileId)
				// 	.where("conflict", "is not", null)
				// 	.execute()

				const changes = await this.lix?.db
					.selectFrom("change")
					.selectAll()
					.select((eb) =>
						jsonObjectFrom(
							eb
								.selectFrom("commit")
								.select(["commit.id", "commit.created", "commit.user_id", "commit.description"])
								.whereRef("commit.id", "=", "change.commit_id")
						).as("commit")
					)
					.where("file_id", "=", this.fileId)
					.where("commit_id", "is not", null)
					.innerJoin("commit", "commit.id", "change.commit_id")
					.orderBy("commit.created", "desc")
					.execute()
				return { uncommittedChanges, changes, conflicts }
			},
			(value) => {
				if (value) {
					this.uncommittedChanges = value.uncommittedChanges ?? []
					this.changes = value.changes ?? []

					this.conflicts = value.conflicts ?? []
				}
			}
		)
	}

	@state()
	uncommittedChanges: Change[] = []

	@state()
	changes: (Change & { commit: Commit })[] = []

	@state()
	conflicts: any[] = []

	@state()
	fileId?: string = undefined

	render() {
		return html`
			${this.parseCsvTask.render({
				loading: () => html`<p>Loading...</p>`,
				error: (error) => html`<p>Error: ${error}</p>`,
				complete: (csv) => {
					return html`
						<table>
							<thead>
								<tr>
									${csv.meta.fields!.map((field) => html`<th>${field}</th>`)}
								</tr>
							</thead>
							<tbody>
								${repeat(
									csv.data,
									(row) => row,
									(row: any) => html`
										<tr>
											${csv.meta.fields!.map((field) => {
												const cellId = `${row.id}-${field}`

												const uncommittedChanges = this.uncommittedChanges.filter(
													(change) => change.value?.id === cellId
												)
												const conflicts = this.conflicts.filter(
													(change) => change.value.id === cellId
												)
												const hasUncommittedChanges = uncommittedChanges.length > 0
												const hasConflicts = conflicts.length > 0

												const changes = this.changes.filter((change) => change.value?.id === cellId)

												const hasChanges = changes.length > 0

												return html`<td class="p-2">
													<div class="flex">
														<input
															class=${classMap({
																"border-2": hasUncommittedChanges,
																"border-yellow-500": hasUncommittedChanges,
																"border-red-500": hasConflicts,
															})}
															value=${row[field]}
															@input=${(event: any) => {
																// @ts-ignore
																csv.data[csv.data.indexOf(row)][field] = event.target.value
																// manually saving file to lix
																this.lix?.db
																	.updateTable("file")
																	.set({
																		data: new TextEncoder().encode(Papa.unparse(csv.data)),
																	})
																	.where("path", "=", this.openFile!)
																	.execute()
															}}
														/>
														<sl-dropdown>
															<sl-button size="sm" caret slot="trigger"></sl-button>
															<div class="bg-white p-4">
																${hasConflicts
																	? html`<div class="divide-y space-y-3 mb-4">
																			CONFLICT: "${conflicts[0].conflict[0].value.text}"
																			<button
																				@click=${() => {
																					this.lix?.db
																						.updateTable("change")
																						.set({
																							conflict: null,
																						})
																						.where("id", "=", conflicts[0].id)
																						.execute()
																				}}
																			>
																				mark resolved
																			</button>
																	  </div>`
																	: ""}
																${hasChanges === false
																	? html`<p>No change history</p>`
																	: html`<div class="divide-y space-y-3">
																			${changes.map((change) => {
																				const now = new Date()
																				const changeDate = new Date(change.commit.created!)
																				const diff = now.getTime() - changeDate.getTime()

																				const minutesAgo = Math.floor(diff / 1000 / 60)

																				return html`
																					<!-- TODO -->
																					<div class="space-y-2 pb-3">
																						<div>${change.value?.text}</div>
																						<div class="p-0"></div>
																						<div class="text-sm italic">
																							by ${change.commit.user_id} ${minutesAgo} minutes ago
																						</div>
																						<button
																							@click=${() => {
																								// @ts-ignore
																								csv.data[csv.data.indexOf(row)][field] =
																									change.value?.text
																								// manually saving file to lix
																								this.lix?.db
																									.updateTable("file")
																									.set({
																										data: new TextEncoder().encode(
																											Papa.unparse(csv.data)
																										),
																									})
																									.where("path", "=", this.openFile!)
																									.execute()
																							}}
																						>
																							Restore this Value
																						</button>
																					</div>
																				`
																			})}
																	  </div>`}
															</div>
														</sl-dropdown>
													</div>
												</td>`
											})}
										</tr>
									`
								)}
							</tbody>
						</table>
					`
				},
			})}
		`
	}
}
