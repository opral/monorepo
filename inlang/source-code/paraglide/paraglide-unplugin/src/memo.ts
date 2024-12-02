import crypto from "node:crypto"

const hashes = new Map<Function, string>()
const outputs = new Map<Function, any>()
export function memoized<T extends (...args: any[]) => Promise<any>>(
	fn: T
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
	return async (...args) => {
		const existingHash = hashes.get(fn)
		const computedHash = hash(...args)
		if (existingHash && existingHash !== computedHash) {
			return outputs.get(fn)
		}
		hashes.set(fn, computedHash)
		const output = await fn(...args)
		outputs.set(fn, output)
		return output
	}
}

function hash(...args: any[]) {
	try {
		const hash = crypto.createHash("sha256")
		for (const arg of args) {
			hash.update(JSON.stringify(arg))
		}
		return hash.digest("hex")
	} catch (e) {
		return crypto.randomUUID()
	}
}
