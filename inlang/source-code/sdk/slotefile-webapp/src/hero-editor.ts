import { storage } from "./storage/db"
import { randomHumanId } from "../../src/storage/human-id/human-readable-id.js"

export function setupHeroEditor({
	heroNameElement,
	heroAgeElement,
	heroIdElement,
	saveElement,
}: {
	heroNameElement: HTMLInputElement
	heroAgeElement: HTMLInputElement
	heroIdElement: HTMLInputElement
	saveElement: HTMLButtonElement
}) {
	let heroId: string
	let heroName: string
	let heroAge: number
	const resetForm = () => {
		heroNameElement.value = ""
		heroAgeElement.value = ""
		heroIdElement.value = ""
	}
	const upsertHero = async (id: string, name: string, age: number) => {
		const db$ = (await storage).database
		if (id === "") {
			await db$.heroes
				.insert({
					id: randomHumanId(),
					name,
					age,
					createdAt: new Date().getTime(),
					updatedAt: new Date().getTime(),
				})
				.then(resetForm)
		} else {
			await db$.heroes
				.upsert({
					id,
					name,
					age,
					updatedAt: new Date().getTime(),
				})
				.then(resetForm)
		}
	}
	saveElement.addEventListener("click", () => {
		heroName = heroNameElement.value
		heroId = heroIdElement.value
		heroAge = isNaN(parseInt(heroAgeElement.value, 10)) ? -1 : parseInt(heroAgeElement.value, 10)
		if (heroName.length > 0 && heroAge) {
			upsertHero(heroId, heroName, heroAge)
		} else {
			alert("Please fill all the fields")
		}
	})
}
