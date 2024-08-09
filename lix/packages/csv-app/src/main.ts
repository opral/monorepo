import { html, nothing } from "lit"
import { customElement, state } from "lit/decorators.js"
import { Ref, createRef, ref } from "lit/directives/ref.js"
import { newLixFile, openLixInMemory } from "@lix-js/sdk"

import "./file-view"
import "./csv-view"
import plugin from "./csv-plugin.js"
import { poll } from "./reactivity"
import { BaseElement } from "./baseElement"
import "@shoelace-style/shoelace"
import { v4 as uuid } from "uuid"

let lixOPFSPath = "-file.lix"

function humanFileSize(bytes, si = false, dp = 1) {
	const thresh = si ? 1000 : 1024

	if (Math.abs(bytes) < thresh) {
		return bytes + " B"
	}

	const units = si
		? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
		: ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
	let u = -1
	const r = 10 ** dp

	do {
		bytes /= thresh
		++u
	} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

	return bytes.toFixed(dp) + " " + units[u]
}

const getDirectoryEntriesRecursive = async (relativePath = ".") => {
	// @ts-ignore
	const directoryHandle = await navigator.storage.getDirectory()
	const fileHandles = []
	const directoryHandles = []

	// Get an iterator of the files and folders in the directory.
	// @ts-ignore
	const directoryIterator = directoryHandle.values()
	const directoryEntryPromises = []
	for await (const handle of directoryIterator) {
		const nestedPath = `${relativePath}/${handle.name}`
		if (handle.kind === "file") {
			// @ts-ignore
			fileHandles.push({ handle, nestedPath })
			directoryEntryPromises.push(
				// @ts-ignore
				handle.getFile().then((file) => {
					return {
						name: handle.name,
						file,
						size: humanFileSize(file.size),
						relativePath: nestedPath,
						handle,
					}
				})
			)
		} else if (handle.kind === "directory") {
			// @ts-ignore
			directoryHandles.push({ handle, nestedPath })
			directoryEntryPromises.push(
				// @ts-ignore
				(async () => {
					return {
						name: handle.name,
						// @ts-ignore
						file,
						// @ts-ignore
						size: humanFileSize(file.size),
						relativePath: nestedPath,
						// @ts-ignore
						entries: await getDirectoryEntriesRecursive(handle, nestedPath),
						handle,
					}
				})()
			)
		}
	}
	return await Promise.all(directoryEntryPromises)
}

@customElement("csv-app")
export class App extends BaseElement {
	constructor() {
		super()
		// @ts-ignore
		this.username = "User " + this.getAttribute("name")
		// @ts-ignore
		this.dbName = this.getAttribute("name") + lixOPFSPath
		const self = this

		if (this.lix === undefined) {
			getDirectoryEntriesRecursive().then((res) => {
				// @ts-ignore
				window.files = res
				console.log(res)
			})

			navigator.storage.getDirectory().then(async (dir) => {
				try {
					const handle = await dir.getFileHandle(self.dbName, {
						create: false,
					})

					const dbBlob = await (await handle.getFile()).arrayBuffer()

					self.lix = await openLixInMemory({ arrayBuffer: dbBlob, providePlugins: [plugin] })

					// @ts-expect-error
					window.lix = self.lix
				} catch (e) {
					console.log(e)
				}

				async function saveDb() {
					// FIXME: saving B- crashes!
					if (!self.lix || self.dbName.startsWith("B-")) {
						return
					}

					await saveInOPFS({ blob: await self.lix.toBlob(), path: self.dbName }).then(() =>
						console.log(self.dbName + " saved to opfs")
					)
				}

				setInterval(saveDb, 5000 + Math.floor(Math.random() * 1000)) // add jitter beacause saving db concurrently crashes sqlite
			})
		}
	}

	async handleCreateLix() {
		this.lix = await openLixInMemory({ blob: await newLixFile(), providePlugins: [plugin] })
	}

	async resetB() {
		const opfsRoot = await navigator.storage.getDirectory()
		// TODO file names based on UUID to avoid collisions
		const fileHandleA = await opfsRoot.getFileHandle("A" + lixOPFSPath, {
			create: false,
		})

		const fileA = await (await fileHandleA.getFile()).arrayBuffer()

		const fileHandleB = await opfsRoot.getFileHandle("B" + lixOPFSPath, {
			create: false,
		})

		const writable = await fileHandleB.createWritable()
		await writable.write(fileA)
		await writable.close()
	}

	async merge() {
		await this.lix.merge({ path: "B" + lixOPFSPath, userId: this.username })
	}

	@state() dbName = ""

	@state() lix

	@state() openFile = "test.csv"

	@state() username = ""

	render() {
		return html`
			<br /><br /><br /><br /><br /><br /><br /><br />
			<div style="display: flex; gap: 2rem;">
				<button @click=${this.handleCreateLix}>Create new lix file</button>

				<export-lix .dbName=${this.dbName}></export-lix>

				<button @click=${this.resetB}>Reset B to A</button>

				<file-importer .lix=${this.lix}></file-importer>

				<button @click=${this.merge}>Merge B into A</button>
			</div>
			<hr style="margin-top: 1rem;" />
			${this.lix
				? html`<div>
						<file-view .lix=${this.lix} .openFile=${this.openFile}></file-view>
				  </div>`
				: html`<p>No lix loaded</p>`}
			<hr />
			<lix-actions .username=${this.username} .lix=${this.lix}></lix-actions>
			<hr />
			${this.lix
				? html`<csv-view .lix=${this.lix} .openFile=${this.openFile}></csv-view>`
				: nothing}
		`
	}
}

@customElement("lix-actions")
export class LixActions extends BaseElement {
	lix: any
	connectedCallback(): void {
		// @ts-ignore
		super.connectedCallback()
		poll(
			async () => {
				const numUncommittedChanges = await this.lix?.db
					.selectFrom("change")
					.select(({ fn }) => [fn.count("id").as("count")])
					.where("commit_id", "is", null)
					.executeTakeFirst()
				const comittedChanges = await this.lix?.db
					.selectFrom("change")
					.select(({ fn }) => [fn.count("id").as("count")])
					.where("commit_id", "is not", null)
					.executeTakeFirst()
				return { numUncommittedChanges, comittedChanges }
			},
			({ numUncommittedChanges, comittedChanges }) => {
				if (numUncommittedChanges && comittedChanges) {
					this.numUncommittedChanges = numUncommittedChanges!.count
					this.numCommittedChanges = comittedChanges!.count
				}
			}
		)
	}

	@state() numUncommittedChanges = 0

	@state() numCommittedChanges = 0

	username: string = ""

	async handleCommit() {
		await this.lix!.commit({
			userId: this.username,
			// TODO unbundle description from commits
			description: "",
		})
	}

	render() {
		return html`
			<h2>Lix actions</h2>
			<!-- name -->
			<div>
				<label for="name">Name</label>
				<input
					id="name"
					type="text"
					.value=${this.username}
					@input=${(e: any) => {
						this.username = e.target.value
					}}
				/>
			</div>
			<!-- commits -->
			<div class="flex gap-4 justify-between">
				<div class="flex gap-4">
					<p>Uncommitted changes: ${this.numUncommittedChanges}</p>
					<p>Committed changes: ${this.numCommittedChanges}</p>
				</div>
				<button @click=${this.handleCommit}>Commit</button>
			</div>
		`
	}
}

@customElement("file-importer")
export class InlangFileImport extends BaseElement {
	lix: any

	async handleFileSelection(event: any) {
		const file: File = event.target.files[0]
		await this.lix?.db
			.insertInto("file")
			.values({
				// uuid.{file extension}
				// jsi2089-28nz92.csv
				id: uuid() + file.name.split(".").join(""),
				path: file.name,
				data: await file.arrayBuffer(),
			})
			.execute()
	}

	inputRef: Ref<HTMLInputElement> = createRef()

	render() {
		return html`
			<div>
				<input
					${ref(this.inputRef)}
					style="display: none;"
					type="file"
					id="selected-file"
					name="hello"
					@change=${this.handleFileSelection}
				/>
				<button @click=${() => this.inputRef.value?.click()}>Import file</button>
			</div>
		`
	}
}

@customElement("export-lix")
export class ExportLix extends BaseElement {
	dbName: string = ""

	async handleExportLix() {
		const opfsRoot = await navigator.storage.getDirectory()
		// TODO file names based on UUID to avoid collisions
		const fileHandle = await opfsRoot.getFileHandle(this.dbName, {
			create: false,
		})

		const file = await fileHandle.getFile()

		const result = await file.arrayBuffer()
		const blob = new Blob([result])

		console.log(blob)
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = this.dbName
		a.click()
	}

	render() {
		return html` <button @click=${this.handleExportLix}>Export lix file</button> `
	}
}

/**
 * Imports a project from a blob into OPFS.
 */
async function saveInOPFS(args: { blob: Blob; path: string }) {
	const opfsRoot = await navigator.storage.getDirectory()
	// TODO file names based on UUID to avoid collisions
	const fileHandle = await opfsRoot.getFileHandle(args.path, {
		create: true,
	})
	const writable = await fileHandle.createWritable()
	await writable.write(args.blob)
	await writable.close()
}
