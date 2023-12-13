import { describe, it, expect, test } from "vitest"
import { normalizePath } from "./helpers.js"

describe("single slash", () => {
	it("should always return a single forward slash", () => {
		expect(normalizePath("/")).toBe("/")
		expect(normalizePath("\\")).toBe("/")
	})
})

test("should not fail on normalizing the root with an absolute path", () => {
	expect(normalizePath("/" + "/project.inlang")).toBe("/project.inlang")
})

describe("strip trailing slashes", () => {
	const units: [string, string][] = [
		["../../foo/bar", "foo/bar"],
		["..\\..\\foo/bar", "foo/bar"],
		["..\\\\..\\\\foo/bar", "foo/bar"],
		["//foo/bar\\baz", "/foo/bar/baz"],
		["//foo\\bar\\baz", "/foo/bar/baz"],
		["/user/docs/Letter.txt", "/user/docs/Letter.txt"],
		["\\?\\C:\\user\\docs\\Letter.txt", "/?/C:/user/docs/Letter.txt"],
		["\\?\\UNC\\Server01\\user\\docs\\Letter.txt", "/?/UNC/Server01/user/docs/Letter.txt"],
		["\\\\.\\CdRomX", "//CdRomX"],
		["\\\\.\\PhysicalDiskX", "//PhysicalDiskX"],
		["\\\\?\\C:\\user\\docs\\Letter.txt", "//?/C:/user/docs/Letter.txt"],
		["\\\\?\\UNC\\Server01\\user\\docs\\Letter.txt", "//?/UNC/Server01/user/docs/Letter.txt"],
		["\\Server01\\user\\docs\\Letter.txt", "/Server01/user/docs/Letter.txt"],
		["C:\\user\\docs\\Letter.txt", "C:/user/docs/Letter.txt"],
		[
			"C:\\user\\docs\\somefile.ext:alternate_stream_name",
			"C:/user/docs/somefile.ext:alternate_stream_name",
		],
		["C:Letter.txt", "C:Letter.txt"],
		["E://foo//bar//baz", "E:/foo/bar/baz"],
		["E://foo//bar//baz//", "E:/foo/bar/baz"],
		["E://foo//bar//baz//////", "E:/foo/bar/baz"],
		["E://foo/bar\\baz", "E:/foo/bar/baz"],
		["E://foo\\bar\\baz", "E:/foo/bar/baz"],
		["E:/foo/bar/baz/", "E:/foo/bar/baz"],
		["E:/foo/bar/baz///", "E:/foo/bar/baz"],
		["E:\\\\foo/bar\\baz", "E:/foo/bar/baz"],
		["foo\\bar\\baz", "foo/bar/baz"],
		["foo\\bar\\baz\\", "foo/bar/baz"],
		["foo\\bar\\baz\\\\\\", "foo/bar/baz"],
	]

	for (const unit of units) {
		it(`should normalize ${unit[0]}`, () => {
			expect(normalizePath(unit[0], true)).toBe(unit[1])
		})
	}
})

describe("keep trailing slashes", () => {
	const units: [string, string][] = [
		["\\", "/"],
		["foo\\bar\\baz\\", "foo/bar/baz/"],
		["foo\\\\bar\\\\baz\\\\", "foo/bar/baz/"],
		["foo//bar//baz//", "foo/bar/baz/"],
		["foo/bar/baz/", "foo/bar/baz/"],
		["./foo/bar/baz/", "foo/bar/baz/"],
		["/foo/bar/../baz/", "/foo/baz/"],
		["/foo/bar/bar/bar/../../baz/", "/foo/bar/baz/"],
	]

	for (const unit of units) {
		it(`should normalize ${unit[0]}`, () => {
			expect(normalizePath(unit[0], false)).toBe(unit[1])
		})
	}
})
