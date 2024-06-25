import { describe, it, expect, test } from "vitest"
import { normalizePath, getBasename, getDirname } from "./helpers.js"

describe("single slash", () => {
	it("should always return a single forward slash", () => {
		expect(normalizePath("/")).toBe("/")
		expect(normalizePath("\\")).toBe("/")
	})
})

test("should not fail on normalizing the root with an absolute path", () => {
	expect(normalizePath("/" + "/project.inlang")).toBe("/project.inlang")
})

test("not add a slash", () => {
	expect(normalizePath("project.inlang")).toBe("project.inlang")
})

test("should add leading slash", () => {
	expect(normalizePath("project.inlang", { leadingSlash: 'always'})).toBe("/project.inlang")
})

test("should add trailing slash", () => {
	expect(normalizePath("project.inlang", { trailingSlash: 'always' })).toBe("project.inlang/")
})

describe("keep heading slashes free for windows norm", () => {
	const units: [string, string][] = [
		["C:\\user\\docs\\Letter.txt", "C:/user/docs/Letter.txt"],
		[
			"C:\\user\\docs\\somefile.ext:alternate_stream_name",
			"C:/user/docs/somefile.ext:alternate_stream_name",
		],
		["C:Letter.txt", "C:Letter.txt"],
		["E://foo//bar//baz", "E:/foo/bar/baz"],
		["E://foo//bar//baz//", "E:/foo/bar/baz/"],
		["E://foo//bar//baz//////", "E:/foo/bar/baz/"],
		["E://foo/bar\\baz", "E:/foo/bar/baz"],
		["E://foo\\bar\\baz", "E:/foo/bar/baz"],
		["E:/foo/bar/baz/", "E:/foo/bar/baz/"],
		["E:/foo/bar/baz///", "E:/foo/bar/baz/"],
		["E:\\\\foo/bar\\baz", "E:/foo/bar/baz"],
	]

	for (const unit of units) {
		it(`should normalize ${unit[0]}`, () => {
			expect(normalizePath(unit[0])).toBe(unit[1])
		})
	}
})

describe("strip trailing slashes", () => {
	const units: [string, string][] = [
		["../../foo/bar", "/foo/bar"],
		["..\\..\\foo/bar", "/foo/bar"],
		["..\\\\..\\\\foo/bar", "/foo/bar"],
		["//foo/bar\\baz", "/foo/bar/baz"],
 		["//foo\\bar\\baz", "/foo/bar/baz"],
		["/user/docs/Letter.txt", "/user/docs/Letter.txt"],
		["\\\\.\\CdRomX", "/CdRomX"],
		["\\\\.\\PhysicalDiskX", "/PhysicalDiskX"],
		["\\Server01\\user\\docs\\Letter.txt", "/Server01/user/docs/Letter.txt"],
		["foo\\bar\\baz", "/foo/bar/baz"],
		["foo\\bar\\baz\\", "/foo/bar/baz"],
		["foo\\bar\\baz\\\\\\", "/foo/bar/baz"],
	]

	for (const unit of units) {
		it(`should normalize ${unit[0]}`, () => {
			expect(normalizePath(unit[0], { leadingSlash: 'always', trailingSlash: 'strip' })).toBe(unit[1])
		})
	}
})

describe("keep trailing slashes", () => {
	const units: [string, string][] = [
		["\\", "/"],
 		["foo\\bar\\baz\\", "/foo/bar/baz/"],
	 	["foo\\\\bar\\\\baz\\\\", "/foo/bar/baz/"],
		["foo//bar//baz//", "/foo/bar/baz/"],
		["foo/bar/baz", "/foo/bar/baz"],
		["foo//bar/./baz//", "/foo/bar/baz/"],
		["./foo/bar/baz/", "/foo/bar/baz/"],
		["/foo/bar/../baz/", "/foo/baz/"],
		["/foo/bar/bar/bar/../../baz/", "/foo/bar/baz/"],
	]

	for (const unit of units) {
		it(`should normalize ${unit[0]}`, () => {
			expect(normalizePath(unit[0], { leadingSlash: 'always' })).toBe(unit[1])
		})
	}
})

// only for internal use! will always append a trailing slash for mem fs expectations
describe("get dirname", () => {
	const units: [string, string][] = [
		["/", "/"],
		["foo/bar/baz/", "/foo/bar/"],
		["./foo/bar/baz/", "/foo/bar/"],
		["/home/user1/documents/", "/home/user1/"]
	]

	for (const unit of units) {
		it(`should get dirname ${unit[0]}`, () => {
			expect(getDirname(unit[0])).toBe(unit[1])
		})
	}
})

describe("get basename", () => {
	const units: [string, string][] = [
		["/", ""],
		["//", ""],
		["./", "."],
		["foo/bar/baz/", "baz"],
		["./foo/bar/baz/", "baz"],
		["./foo/bar/baz//", "baz"],
	]

	for (const unit of units) {
		it(`should get basename ${unit[0]}`, () => {
			expect(getBasename(unit[0])).toBe(unit[1])
		})
	}
})
