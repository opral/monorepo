export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function delay(v: unknown, ms: number) {
	return new Promise((resolve) => setTimeout(() => resolve(v), ms))
}

export function fail(ms: number) {
	return new Promise((resolve, reject) => setTimeout(() => reject(new Error("fail")), ms))
}
