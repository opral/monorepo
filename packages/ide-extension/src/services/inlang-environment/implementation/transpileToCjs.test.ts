import { it, expect, afterAll } from "vitest"
import { transpileToCjs } from "./transpileToCjs.js"
import fs from "node:fs"

const currentDirectoryPath = new URL(import.meta.url).pathname.replace(/\/[^/]+$/, "/")
const tempdir = fs.mkdtempSync(currentDirectoryPath)

afterAll(() => {
	fs.rmSync(tempdir, { recursive: true, force: true })
})

it("should transpile esm to cjs code which can then be imported with require", () => {
	const esmCode = `
    export function hello(x) {
      return "Hello " + x
    }
  `
	const cjsCode = transpileToCjs(esmCode)
	const filePath = `${tempdir}/testfile1.cjs`
	fs.writeFileSync(filePath, cjsCode, { encoding: "utf8" })
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const module = require(filePath)
	expect(module.hello("World")).toBe("Hello World")
})
