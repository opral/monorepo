import { describe, test } from "vitest";

describe("parseLintSettings", async () => {
	test("when `undefined` get's passed", async () => {

	})

	test("when `error` get's passed", async () => {

	})

	test("when `warning` get's passed", async () => {

	})

	test("when `true` get's passed", async () => {

	})

	test("when `false` get's passed", async () => {

	})

	test("when custom `settings` get's passed", async () => {

	})
})

describe("createContext", async () => {
	describe("report", async () => {
		describe("node", async () => {
			test("should not throw if no node gets passed to 'report'", async () => {

			})

			test("should create a `lint` property on the node if not present yet", async () => {

			})

			test("should attach to the `lint` property on the node if present", async () => {

			})
		})

		describe("payload", async () => {
			test("should set the passed `id`", async () => {

			})

			test("should set the passed `level`", async () => {

			})

			test("should set the passed `message`", async () => {

			})

			test("should set the passed `metadata`", async () => {

			})

			test("should not set `metadata` if nothing get's passed", async () => {

			})
		})
	})
})

describe("printReport", async () => {
	test("should not print anything if no report get's passed", async () => {

	})

	describe("information should include", async () => {
		test("level", async () => {

		})

		test("id", async () => {

		})

		test("message", async () => {

		})

		test("no metadata if not present", async () => {

		})

		test("metadata if present", async () => {

		})
	})

	describe("level", async () => {
		test("should use `console.error` on 'error'", async () => {

		})

		test("should use `console.warn` on 'warning'", async () => {

		})
	})
})
