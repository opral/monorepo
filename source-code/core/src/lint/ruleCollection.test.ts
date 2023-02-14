import { describe, test, vi } from "vitest";
describe("createRuleCollection", async () => {
	test("once called, should return an `Array` of all specified rules", async () => {

	})

	describe("should use defaults when nothing gets passed", async () => {
		test("globally", async () => {

		})

		test("for a specific rule", async () => {

		})
	})

	describe("should pass the correct settings to each lint rule", async () => {
		describe("single param", async () => {
			test("'false'", async () => {

			})

			test("'true'", async () => {

			})

			test("'error'", async () => {

			})

			test("'warn'", async () => {

			})
		})

		describe("as tuple with single entry", async () => {
			test("'false'", async () => {

			})

			test("'true'", async () => {

			})

			test("'error'", async () => {

			})

			test("'warn'", async () => {

			})
		})

		test("pass rule specific settings", async () => {

		})
	})
})
