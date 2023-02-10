import { describe, test } from "vitest";

describe("rules", async () => {
	test("should be able to disable rule", async () => {

	})

	test("should be able to override lint type", async () => {

	})

	test("should not start linting if no rules are specified", async () => {

	})

	test("should process all 'Resources'", async () => {

	})

	test("should process all 'Resources' for all rules", async () => {

	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("visitors", () => {
	test("should visit all nodes exactly once", async () => {

	})

	describe("should await", async () => {
		test("'initialize'", async () => {

		})

		test("'teardown'", async () => {

		})

		describe("'Resource'", async () => {
			test("'enter'", async () => {

			})

			test("'leave'", async () => {

			})
		})

		describe("'Message'", async () => {
			test("'enter'", async () => {

			})

			test("'leave'", async () => {

			})
		})

		describe("'Pattern'", async () => {
			test("'enter'", async () => {

			})

			test("'leave'", async () => {

			})
		})
	})

	describe("should skip processing children", async () => {
		describe("if no visitor is specified", async () => {
			describe("for 'Resource'", async () => {
				test("node", async () => {

				})

				describe("but not if children has visitor specified", async () => {
					test("for Message", async () => {

					})

					test("for Pattern", async () => {

					})
				})
			})

			describe("for Message", async () => {
				test("node", async () => {

				})

				describe("but not if children has visitor specified", async () => {
					test("for Pattern", async () => {

					})
				})
			})

			describe("for Pattern", async () => {
				test("node", async () => {

				})
			})
		})

		describe("if 'skip' get's returned by a visitor", async () => {
			test("for 'Resource'", async () => {

			})

			test("for 'Message'", async () => {

			})

			test("for 'Pattern'", async () => {

			})
		})
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("exceptions", async () => {
	describe("should not kill process", async () => {
		test("if 'teardown' is not present", async () => {

		})

		describe("for 'Resource'", async () => {
			test("if not present", async () => {

			})

			test("if 'enter' is not present", async () => {

			})

			test("if 'leave' is not present", async () => {

			})
		})

		describe("for 'Message'", async () => {
			test("if not present", async () => {

			})

			test("if 'enter' is not present", async () => {

			})

			test("if 'leave' is not present", async () => {

			})
		})

		describe("for 'Pattern'", async () => {
			test("if not present", async () => {

			})

			test("if 'enter' is not present", async () => {

			})

			test("if 'leave' is not present", async () => {

			})
		})

		describe("if visitor throws", async () => {
			describe("in 'Resource'", async () => {
				test("'enter'", async () => {

				})

				test("'leave'", async () => {

				})
			})

			describe("in 'Message'", async () => {
				test("'enter'", async () => {

				})

				test("'leave'", async () => {

				})
			})

			describe("in 'Pattern'", async () => {
				test("'enter'", async () => {

				})

				test("'leave'", async () => {

				})
			})
		})
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("payloads", async () => {
	describe("should receive the payload", async () => {
		test("in 'initialize", async () => {

		})

		describe("in 'teardown'", async () => {
			test("from the 'initialize' function", async () => {

			})

			test("'undefined' if no payload returned from 'initialize'", async () => {

			})
		})
	})

	// test pass copy instead of object reference
	// test altering payloads
	// test not returning payloads
})