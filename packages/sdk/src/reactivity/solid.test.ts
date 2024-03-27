import { describe, it, expect } from "vitest"
import { createSignal, createEffect, createMemo } from "./solid.js"

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe("solid", () => {
	it("sets and gets", () => {
		const [get, set] = createSignal(0)

		expect(get()).toBe(0)
		set(1)
		expect(get()).toBe(1)
	})

	it("runs an effect whenn the signal value change", () => {
		const [get, set] = createSignal(0)
		let count = 0
		createEffect(() => {
			count++
			get()
		})
		expect(count).toBe(1)
		set(1)
		expect(count).toBe(2)
		set(1)
		expect(count).toBe(2)
		set(0)
		expect(count).toBe(3)
	})

	it("runs an effect on a derived signal, when the underlying signal changes", () => {
		const [get, set] = createSignal(0)
		const derived = () => get() * 2
		let count = 0
		createEffect(() => {
			count++
			derived()
		})
		expect(count).toBe(1)
		set(1)
		expect(count).toBe(2)
		set(1)
		expect(count).toBe(2)
		set(0)
		expect(count).toBe(3)
	})

	it("signal values are not deep diffed for equality", () => {
		const [get, set] = createSignal({ a: 0, b: [1, 2, 3], c: { d: 4 } })
		let count = 0
		createEffect(() => {
			count++
			get()
		})
		expect(count).toBe(1)
		set({ a: 0, b: [1, 2, 3], c: { d: 5 } })
		expect(count).toBe(2)
		set({ a: 0, b: [1, 2, 3], c: { d: 5 } })
		expect(count).toBe(3)
		set({ a: 0, b: [1, 2, 3], c: { d: 4 } })
		expect(count).toBe(4)
	})

	it("await in effect prevents signal from being tracked", async () => {
		const [get, set] = createSignal(0)
		let count = 0
		// effect bumps count - depends on get() - never gets called again
		createEffect(async () => {
			count++
			await sleep(0)
			get()
		})
		expect(count).toBe(1)
		set(1)
		expect(count).toBe(1)
		await sleep(0)
		set(2)
		expect(count).toBe(1)
	})

	it("signal behind function call is tracked - same as derived", async () => {
		const [get, set] = createSignal(0)
		let count = 0
		const fn = () => get()
		createEffect(async () => {
			count++
			fn()
		})
		expect(count).toBe(1)
		set(1)
		expect(count).toBe(2)
	})

	it("memoizes values and updates them when signals change", () => {
		const [get, set] = createSignal(0)
		let count = 0
		const memo = createMemo(() => {
			count++
			return `memo = ${2 * get()}`
		})
		expect(count).toBe(1)
		expect(memo()).toBe("memo = 0")
		expect(count).toBe(1)
		expect(memo()).toBe("memo = 0")
		expect(count).toBe(1)
		set(1)
		expect(count).toBe(2)
		expect(memo()).toBe("memo = 2")
		set(1)
		expect(count).toBe(2)
		expect(memo()).toBe("memo = 2")
		expect(count).toBe(2)
		expect(memo()).toBe("memo = 2")
		set(1000)
		expect(count).toBe(3)
		expect(memo()).toBe("memo = 2000")
	})
})
