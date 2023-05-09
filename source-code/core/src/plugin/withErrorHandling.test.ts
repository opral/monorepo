import { expect, it, vi } from "vitest"
import { withErrorHandling } from "./withErrorHandling.js"

const mockPlugin = withErrorHandling("mock.plugin", {
	config: () => {
		throw Error("Ups")
	},
	multiply: (a: number, b: number) => a * b,
	deeplyMultiply: () => () => {
		throw Error("Ups from deeplyMultiply")
	},
	returnsObject: () => ({
		multiply: () => {
			throw Error("Ups from returnsObject.multiply")
		},
	}),
	var: 5,
	deepObject: {
		multiply: () => {
			throw Error("Ups from deepObject.multiply")
		},
	},
})

it("should console error if a function crashed", () => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => undefined)

	try {
		mockPlugin.config()
	} catch (error) {
		// ignore
	}

	expect(spy).toHaveBeenCalledOnce()
})

it("should work as usual if a plugin doesn't crash", () => {
	expect(mockPlugin.multiply(2, 3)).toEqual(6)
})

it("should work for nested functions", () => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => undefined)

	try {
		mockPlugin.deeplyMultiply()()
	} catch (error) {
		// ignore
	}

	expect(spy).toHaveBeenCalledOnce()
})

it("should work for nested objects", () => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => undefined)

	try {
		mockPlugin.deepObject.multiply()
	} catch (error) {
		// ignore
	}

	expect(spy).toHaveBeenCalledOnce()
})

it("should return primitives correctly", () => {
	expect(mockPlugin.var).toEqual(5)
})

it("should work on function that return an object", () => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => undefined)

	try {
		mockPlugin.returnsObject().multiply()
	} catch (error) {
		// ignore
	}

	expect(spy).toHaveBeenCalledOnce()
})
