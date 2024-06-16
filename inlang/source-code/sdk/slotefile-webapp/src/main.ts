/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "./style.css"
import { setupHeroEditor } from "./hero-editor"
import { setupHeroList } from "./hero-list"
import { db, storage } from "./storage/db"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div>
     <h3>RxDB + SlotMaschine + Lix</h3>
     <div class="card">
      <section>
      <h2>Editor</h2>
	  <input id="heroId" placeholder="Hero ID" />
      <input id="heroName" placeholder="Hero Name" />
	  <input id="heroAge" placeholder="Hero Age" />
      <button id="btnSave">Save</button>
	  <button id="btnAdd100">Add 100 random</button>
	  <button id="btnAdd1000">Add 1000 random</button>
      </section>
      <section>
	  <h2>List</h2>
	  <button id="pull" type="button" label="">Pull Changes</button>
	  <button id="push" type="button" label="">Push Changes</button><br>
	  FILTER 
	  <TABLE>
	  	<TR>
			<TD>
				<input id="nameFilter" placeholder="Name filter" />
			</TD>
<TD>-</TD>
			<TD>
			<input id="ageFilter" placeholder="Age filter" />
			</TD>
			<td>
			
			</td>
			</TR>
	  </TABLE>
      
      <table id="heroList"></table>
      </section>
       
     </div>
</div>`

document.querySelector<HTMLButtonElement>("#pull")!.onclick = async (el) => {
	el.disabled = true
	console.log("pulling latest state")
	const s = await storage
	await s.pullChangesAndReloadSlots()
	document.querySelector<HTMLButtonElement>("#pull")!.disabled = false
}

document.querySelector<HTMLButtonElement>("#push")!.onclick = async function () {
	;(this as HTMLButtonElement).disabled = true
	console.log("push local state")
	const s = await storage
	await s.pushChangesAndReloadSlots()
	;(this as HTMLButtonElement).disabled = false
}

setupHeroEditor({
	heroAgeElement: document.querySelector<HTMLInputElement>("#heroAge")!,
	heroNameElement: document.querySelector<HTMLInputElement>("#heroName")!,
	heroIdElement: document.querySelector<HTMLInputElement>("#heroId")!,
	saveElement: document.querySelector<HTMLButtonElement>("#btnSave")!,
	add100Element: document.querySelector<HTMLButtonElement>("#btnAdd100")!,
	add1000Element: document.querySelector<HTMLButtonElement>("#btnAdd1000")!,
})

await setupHeroList({
	heroAgeElement: document.querySelector<HTMLInputElement>("#heroAge")!,
	heroNameElement: document.querySelector<HTMLInputElement>("#heroName")!,
	heroIdElement: document.querySelector<HTMLInputElement>("#heroId")!,
	heroListElement: document.querySelector<HTMLTableElement>("#heroList")!,
	nameFilterInput: document.querySelector<HTMLInputElement>("#nameFilter")!,
	ageFilterInput: document.querySelector<HTMLInputElement>("#ageFilter")!,
})
