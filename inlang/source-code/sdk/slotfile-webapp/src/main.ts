/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "./style.css"
import { setupMessageBundleList } from "./messageBundleList.js"
import { storage } from "./storage/db-messagebundle.js"
import { pluralBundle } from "./../../src/v2/mocks/index.js"
import { createMessage, createMessageBundle } from "./../../src/v2/helper.js"

import "@inlang/message-bundle-component"
import { MessageBundleRxType } from "./storage/schema-messagebundle.js"
import { randomHumanId } from "../../src/storage/human-id/human-readable-id.js"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div>
     <h3>MessageBundle + RxDB + SlotMaschine + Lix</h3>
     <div class="card">
      <section>
      <h2>Actions</h2>
	  <button id="btnAdd1">Add 1 Message</button>
	  <button id="btnAdd100">Add 100 Messages</button>
	  <button id="btnAdd1000">Add 1000 Messages</button><br><br>
	  <button id="commit" type="button" label="">Commit Changes</button>
	  <button id="push" type="button" label="">Push Changes</button><br>
	  <br><button id="pull" type="button" label="">Pull Changes</button>
      </section>
      <section>
	  <h2>List</h2>
	  
	  <div id="messageList"></div>
      </section>
       
     </div>
	 
</div>`

document.querySelector<HTMLButtonElement>("#pull")!.onclick = async (el) => {
	// @ts-expect-error
	el.disabled = true
	const s = await storage
	await s.pullChangesAndReloadSlots()
	document.querySelector<HTMLButtonElement>("#pull")!.disabled = false
}

document.querySelector<HTMLButtonElement>("#push")!.onclick = async function () {
	;(this as HTMLButtonElement).disabled = true
	const s = await storage
	await s.pushChangesAndReloadSlots()
	;(this as HTMLButtonElement).disabled = false
}

document.querySelector<HTMLButtonElement>("#commit")!.onclick = async function () {
	;(this as HTMLButtonElement).disabled = true
	const s = await storage
	await s.commitChanges()
	;(this as HTMLButtonElement).disabled = false
}

const insertNHeros = async (n: number) => {
	const messagesToAdd = [] as MessageBundleRxType[]
	for (let i = 0; i < n; i++) {
		const newMessage = createMessage({
			locale: "de",
			text: "new",
		})

		const messageBundle = createMessageBundle({
			alias: {},
			messages: [newMessage],
		})
		messagesToAdd.push(messageBundle as unknown as MessageBundleRxType)
	}

	const db$ = (await storage).database
	if (n === 1) {
		const temp = structuredClone(pluralBundle)
		temp.id = randomHumanId()
		temp.messages[0].id = randomHumanId()
		temp.messages[1].id = randomHumanId()

		await db$.messageBundles.insert(temp as any)
		return
	}

	console.time("inserting " + n + " messages")

	await db$.collections.messageBundles.bulkInsert(messagesToAdd)
	console.timeEnd("inserting " + n + " herors")
}

document.querySelector<HTMLButtonElement>("#btnAdd1")!.addEventListener("click", () => {
	insertNHeros(1)
})
document.querySelector<HTMLButtonElement>("#btnAdd100")!.addEventListener("click", () => {
	insertNHeros(100)
})

document.querySelector<HTMLButtonElement>("#btnAdd1000")!.addEventListener("click", () => {
	insertNHeros(1000)
})

await setupMessageBundleList({
	messageListContainer: document.querySelector<HTMLTableElement>("#messageList")!,
	nameFilterInput: document.querySelector<HTMLInputElement>("#nameFilter")!,
	ageFilterInput: document.querySelector<HTMLInputElement>("#ageFilter")!,
})
