// import type { DiffReport, LixPlugin } from "@lix-js/sdk"

/**
 * Getting around bundling for the prototype.
 *
 * @type {import('papaparse')}
 */
let papaparse
// @ts-nocheck

/**
 * @typedef {{ id: string, text: string }} Cell
 */

/**
 * @type {import('@lix-js/sdk').LixPlugin<{
 *  cell: Cell
 * }>}
 */
const plugin = {
	key: "csv",
	glob: "*.csv",

	merge: {
		file: async ({ current, conflicts, changes }) => {
			// incoming.  fileId
			if (!papaparse) {
				// @ts-expect-error - no types
				papaparse = (await import("http://localhost:5173/papaparse.js")).default
			}

			const currentParsed = current
				? papaparse.parse(new TextDecoder().decode(current), {
						header: true,
				  })
				: undefined

			if (currentParsed === undefined) {
				throw new Error("cannot parse file for merging ")
			}

			const resolved = []
			const unresolved = []
			for (const conflict of conflicts) {
				// @ts-ignore
				const { hasConflict, result } = await plugin.merge.cell(conflict)

				result && resolved.push([result])
				hasConflict && unresolved.push(conflict)
			}

			for (const change of [...changes, ...resolved]) {
				const latestChange = change[0] // only using latest change for simple merge cases
				const [rowId, columnName] = latestChange.value.id.split("-")

				// TODO: handle insert/ delete row
				const existingRow = currentParsed.data.find((row) => row.id === rowId)
				existingRow[columnName] = latestChange.value.text
			}

			const resultBlob = new TextEncoder().encode(
				// @ts-expect-error
				papaparse.unparse(currentParsed)
			)

			return { result: resultBlob, unresolved }
		},

		cell: async ({ current, incoming, base }) => {
			// always raise conflicts resolving column "v" for testing
			if (current[0].value.id.endsWith("-v")) {
				const diff = await plugin.diff.cell({ old: current[0].value, neu: incoming[0].value })

				if (diff.length > 0) {
					console.log({ current, incoming, base })
					return { hasConflict: true }
				}
			}

			let chosen
			// choose latest edit
			if (current[0].created > incoming[0].created) {
				chosen = current[0]
			} else {
				chosen = incoming[0]
			}

			return { result: chosen }
		},
	},

	diff: {
		file: async ({ old, neu }) => {
			/** @type {import("@lix-js/sdk").DiffReport[]} */
			const result = []
			// top level import doesn't work
			if (!papaparse) {
				// @ts-expect-error - no types
				papaparse = (await import("http://localhost:5173/papaparse.js")).default
			}

			const oldParsed = old
				? papaparse.parse(new TextDecoder().decode(old.data), {
						header: true,
				  })
				: undefined

			const newParsed = neu
				? papaparse.parse(new TextDecoder().decode(neu.data), {
						header: true,
				  })
				: undefined

			if (newParsed) {
				for (const [i, row] of newParsed.data.entries()) {
					const oldRow = oldParsed?.data[i]
					for (const column in row) {
						const id = `${row.id}-${column}`

						const diff = await plugin.diff.cell({
							old: oldRow
								? {
										id,
										text: oldRow[column],
								  }
								: undefined,
							neu: {
								id,
								text: row[column],
							},
						})

						if (diff.length > 0) {
							result.push(...diff)
						}
					}
				}
			}

			return result
		},

		// @ts-ignore --  TODO: handle return cases for operation independent
		cell: async ({ old, neu }) => {
			if (old?.text === neu?.text) {
				return []
			} else {
				return [
					{
						type: "cell",
						operation: old && neu ? "update" : old ? "delete" : "create",
						old: old,
						neu: neu
							? {
									id: neu.id,
									text: neu.text,
							  }
							: undefined,
					},
				]
			}
		},
	},

	diffComponent: {
		// TODO replace async init by bundling static imports
		// @ts-ignore -- return as html element
		cell: async () => {
			/**
			 * @type {import("lit")}
			 */
			const lit = await import(
				// @ts-expect-error - no types
				"http://localhost:5173/lit-all.js"
			)

			const { diffWords } = await import(
				// @ts-expect-error - no types
				"http://localhost:5173/diff.js"
			)

			return class extends lit.LitElement {
				static properties = {
					old: { type: Object },
					neu: { type: Object },
					show: { type: String },
				}

				old
				neu
				show

				// TODO lix css variables for colors
				addedColor = "green"
				removedColor = "red"

				render() {
					console.log("rerender")
					if (this.old === undefined || this.neu === undefined) {
						return lit.html`<span>${this.old?.text ?? this.neu?.text}</span>`
					}

					const diff = diffWords(this.old.text, this.neu.text)

					return lit.html`
              <span>
                ${diff.map((part) => {
									if (this.show === "neu" && part.removed) {
										return lit.nothing
									} else if (this.show === "old" && part.added) {
										return lit.nothing
									}
									const color = part.added
										? this.addedColor
										: part.removed
										? this.removedColor
										: "black"
									return lit.html`
                    <span style="color: ${color}">${part.value}</span>
                  `
								})}
              </span>
            `
				}
			}
		},
	},
}

export default plugin
