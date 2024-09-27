import { adjectives, animals, verbs } from "./words.js";

export function humanId() {
	return `${adjectives[Math.floor(Math.random() * 256)]}_${
		adjectives[Math.floor(Math.random() * 256)]
	}_${animals[Math.floor(Math.random() * 256)]}_${
		verbs[Math.floor(Math.random() * 256)]
	}`;
}

export function isHumanId(id: string): boolean {
	// naive implementation (good enough for now)
	return id.split("_").length === 4;
}
