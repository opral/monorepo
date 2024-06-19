import { db, storage } from "./storage/db"

export async function setupHeroList({
	heroAgeElement,
	heroNameElement,
	heroIdElement,
	heroListElement,
	nameFilterInput,
	ageFilterInput,
}: {
	heroAgeElement: HTMLInputElement
	heroNameElement: HTMLInputElement
	heroIdElement: HTMLInputElement
	heroListElement: HTMLTableElement
	nameFilterInput: HTMLInputElement
	ageFilterInput: HTMLInputElement
}) {
	const getHeroesList = async () => {
		const db$ = (await storage).database

		const renderTable = (heroes) => {
			let result = `
      <TR>
        <TH>ID</td>
        <TH>name</TH>
        <TH>age</TH>
        <TH>actions</TH>
      </TR>`
			heroListElement.innerHTML = ""
			for (const hero of heroes) {
				result += `
        <tr>
          <td>${hero.id}</td>
          <td>${hero.name} </td>
          <td>${hero.age}</td>
          <td><a href="#" class="edit-hero" data-id="${hero.id}">edit</a></td>
        </tr>`
			}
			heroListElement.innerHTML = result
		}

		let nameFilter = ""
		let ageFilter = -1

		let queryObservable = undefined as any

		const createQuery = () => {
			if (queryObservable !== undefined) {
				queryObservable.unsubscribe(renderTable)
				queryObservable = undefined
			}

			const selector = {} as any

			if (nameFilter !== "") {
				selector.name = { $regex: nameFilter, $options: "i" }
			}
			if (ageFilter !== -1) {
				selector.age = { $gt: ageFilter }
			}

			queryObservable = db$.heroes
				.find({
					selector: selector,
				})
				.sort({ updatedAt: "desc" })
				.$.subscribe(renderTable)
		}

		createQuery()

		nameFilterInput.onkeyup = (ev: any) => {
			nameFilter = ev.target.value
			createQuery()
		}

		ageFilterInput.onchange = (ev: any) => {
			ageFilter = ev.target.value !== "" ? parseInt(ev.target.value, 10) : -1
			createQuery()
		}

		document.body.addEventListener("click", (event: MouseEvent) => {
			// Type guard to ensure the target is an HTMLAnchorElement
			const target = event.target as HTMLElement

			if (target.tagName === "A" && target.classList.contains("edit-hero")) {
				// Get the data-id attribute
				const dataId = (target as HTMLAnchorElement).getAttribute("data-id")

				// Log the data-id attribute
				if (dataId) {
					console.log(dataId)
					const query = db$.heroes
						.findOne({
							selector: {
								id: dataId,
							},
						})
						.exec()
						.then((heroToEdit) => {
							if (heroToEdit) {
								heroIdElement.value = heroToEdit.id!
								heroAgeElement.value = heroToEdit.age! + ""
								heroNameElement.value = heroToEdit.name!
							}
						})
				}
			}
		})
	}
	await getHeroesList()
}
