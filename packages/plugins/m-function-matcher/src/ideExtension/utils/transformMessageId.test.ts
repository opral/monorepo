import { describe, expect, it } from "vitest"
import transformMessageId from "./transformMessageId.js"

describe("transformMessageId function", () => {
	it("should trim the message id", () => {
		expect(transformMessageId(" hello-world ")).toEqual("helloworld")
	})

	it("should remove special characters", () => {
		expect(transformMessageId("hello-^%#@$world")).toEqual("helloworld")
		expect(transformMessageId("hello_world!")).toEqual("hello_world")
		expect(transformMessageId("hello-^%#@$world!@#$%^&*()")).toEqual("helloworld")
	})

	it("should replace multiple spaces with underscores", () => {
		expect(transformMessageId("hello world")).toEqual("hello_world")
		expect(transformMessageId("hello  world   message")).toEqual("hello_world_message")
	})

	it("should replace multiple dots with underscores", () => {
		expect(transformMessageId("hello.world")).toEqual("hello_world")
		expect(transformMessageId("hello..world")).toEqual("hello_world")
		expect(transformMessageId("hello.world.message")).toEqual("hello_world_message")
	})

	it("should preserve text case", () => {
		expect(transformMessageId("helloWorld")).toEqual("helloWorld")
		expect(transformMessageId("HelloWorld")).toEqual("HelloWorld")
		expect(transformMessageId("HELLO_WORLD")).toEqual("HELLO_WORLD")
	})

	it("should prepend an underscore if the transformed ID starts with a number", () => {
		expect(transformMessageId("1 helloWorld")).toEqual("_1_helloWorld")
		expect(transformMessageId("1HelloWorld")).toEqual("_1HelloWorld")
		expect(transformMessageId("12345.5 HELLO_WORLD")).toEqual("_12345_5_HELLO_WORLD")
	})
})
