import { expectType } from "tsd"
import { tryCatch } from "./tryCatch.js"
import type { Result } from "./api.js"
import { it, describe, expect } from "vitest"

function syncPassing(): string {
	return "hello"
}

function syncFailing(): string {
	throw new Error("fail")
}

function asyncFailing(): Promise<string> {
	return Promise.reject(new Error("fail"))
}

function asyncPassing(): Promise<string> {
	return Promise.resolve("hello")
}

expectType<Result<string, unknown>>(tryCatch(() => syncPassing()))
expectType<Result<string, unknown>>(await tryCatch(() => asyncPassing()))

describe("sync", () => {
	it("should return an error if the callback throws", () => {
		const result = tryCatch(() => syncFailing())
		expect(result).toEqual({ error: new Error("fail") })
	})

	it("should return the data if the callback returns", () => {
		const result = tryCatch(() => syncPassing())
		expect(result).toEqual({ data: "hello" })
	})
})

describe("async", () => {
	it("should return an error if the callback rejects", async () => {
		const result = await tryCatch(() => asyncFailing())
		expect(result).toEqual({ error: new Error("fail") })
	})

	it("should return the data if the callback resolves", async () => {
		const result = await tryCatch(() => asyncPassing())
		expect(result).toEqual({ data: "hello" })
	})
})
