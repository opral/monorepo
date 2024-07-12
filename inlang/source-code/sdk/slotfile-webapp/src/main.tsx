/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "./style.css"
import { createRoot } from "react-dom/client"

import "@inlang/message-bundle-component"

document.querySelector<HTMLDivElement>(
	"#app"
)!.innerHTML = `<div id="root" style="height: 100%"></div>`

const domNode = document.getElementById("root")
const root = createRoot(domNode!)
//root.render(<MessageBundleList />)
const isInIframe = window.self !== window.top

if (isInIframe) {
	const { MainViewIframe } = await import("./mainViewIframe.js")
	root.render(
		<MainViewIframe
			repoUrl={new URLSearchParams(window.location.search).get("repo")!}
			projectPath={new URLSearchParams(window.location.search).get("inlangProjectPath")!}
		/>
	)
} else {
	const { MainViewHost } = await import("./mainViewHost.js")
	root.render(<MainViewHost />)
}
// document.querySelector<HTMLButtonElement>("#pull")!.onclick = async (el) => {
// 	// @ts-expect-error
// 	el.disabled = true
// 	const s = await storage
// 	await s.pullChangesAndReloadSlots()
// 	document.querySelector<HTMLButtonElement>("#pull")!.disabled = false
// }

// document.querySelector<HTMLButtonElement>("#push")!.onclick = async function () {
// 	;(this as HTMLButtonElement).disabled = true
// 	const s = await storage
// 	await s.pushChangesAndReloadSlots()
// 	;(this as HTMLButtonElement).disabled = false
// }

// document.querySelector<HTMLButtonElement>("#commit")!.onclick = async function () {
// 	;(this as HTMLButtonElement).disabled = true
// 	const s = await storage
// 	await s.commitChanges()
// 	;(this as HTMLButtonElement).disabled = false
// }

// // TODO trigger lints when a messageBundle change is detected by adapter
// // TODO extract messageBundle<->Message join from adapter to make it availebl in linter
// // TODO trigger slotfile reload o

// storage.then(async (storage) => {
// 	// console.log("storage", storage)
// 	// const linter = await createLintWorker(storage.projectPath, [], storage.fs)
// 	// console.log("linter", linter)
// 	// const reports = await linter.lint({
// 	// 	locales: ["en", "de", "fr"],
// 	// } as ProjectSettings2)
// 	// console.log("reports host", reports)
// })

// const insertNHeros = async (n: number) => {
// 	const messagesToAdd = [] as MessageBundle[]
// 	for (let i = 0; i < n; i++) {
// 		const newMessage = createMessage({
// 			locale: "de",
// 			text: "new",
// 		})

// 		const messageBundle = createMessageBundle({
// 			alias: {},
// 			messages: [newMessage],
// 		})
// 		messagesToAdd.push(messageBundle)
// 	}

// 	const messageBundles = (await storage).inlangProject.messageBundleCollection
// 	if (n === 1) {
// 		const temp = structuredClone(pluralBundle)
// 		temp.id = randomHumanId()
// 		temp.messages[0].id = randomHumanId()
// 		temp.messages[1].id = randomHumanId()

// 		await messageBundles.insert(temp as any)
// 		return
// 	}

// 	console.time("inserting " + n + " messages")

// 	await (await storage).inlangProject.messageBundleCollection.bulkInsert(messagesToAdd)
// 	console.timeEnd("inserting " + n + " herors")
// }

// document.querySelector<HTMLButtonElement>("#btnAdd1")!.addEventListener("click", () => {
// 	insertNHeros(1)
// })
// document.querySelector<HTMLButtonElement>("#btnAdd100")!.addEventListener("click", () => {
// 	insertNHeros(100)
// })

// document.querySelector<HTMLButtonElement>("#btnAdd1000")!.addEventListener("click", () => {
// 	insertNHeros(1000)
// })
