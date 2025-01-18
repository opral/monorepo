import { URL } from "node:url"
import { describe, expect, it } from "vitest"
import * as constants from "./constants"

const DEPENDS_TYPE_REGEX = /^.*:.*$/
// eslint-disable-next-line no-control-regex
const COOKIE_NAME_REGEX = /^((?![()<>@,;:"\\/[\]?={} \x09])[\x20-\x7E])+$/

describe("LANGUAGE_CHANGE_INVALIDATION_KEY", () => {
	it("is a valid URL", () => {
		expect(() => new URL(constants.LANGUAGE_CHANGE_INVALIDATION_KEY)).not.toThrowError()
	})
	it("conforms to the type of LoadEvent#depends", () => {
		expect(constants.LANGUAGE_CHANGE_INVALIDATION_KEY).toMatch(DEPENDS_TYPE_REGEX)
	})
})

describe("LANG_COOKIE_NAME", () => {
	it("is a valid cookie name", () => {
		expect(constants.LANG_COOKIE_NAME).toMatch(COOKIE_NAME_REGEX)
	})
})
