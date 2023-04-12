import { test, expect } from "vitest"
import { memoryFs } from "src/memory"


// Basic test, should be split into several more elaborate tests later

test("memoryFs", async () => {
	const fs: Filesystem = new memoryFs()
	expect(await fs.readdir("/")).toEqual([])

	await fs.mkdir("home/user1/documents/")
	await fs.mkdir("home/user1/downloads")
	expect(await fs.readdir("/")).toEqual(["home"])
	expect(await fs.readdir("/home/user1/")).toEqual(["documents", "downloads"])

	await fs.writeFile("/home/user1/documents/file1", "text in the first file")
	await fs.writeFile("/file2", "text in the second file")
	expect(await fs.readdir("/home/user1/documents/")).toEqual(["file1"]);
	expect(await fs.readdir("/")).toEqual(["home", "file2"]);

	expect(await fs.readFile("/home/user1/documents/file1")).toEqual("text in the first file")
	expect(await fs.readFile("/file2")).toEqual("text in the second file")

	// relative paths
	await fs.writeFile("/home/user1/documents/../file3", "text in the third file")
	expect(await fs.readFile("./home/./user1/file3")).toEqual("text in the third file")

        const fsJson: string = await fs.toJson()
        // dirToJson
        expect(fsJson).toMatchSnapshot()
        
        // dirFromJson (circular references make this tricky to test)
        expect(
            JSON.stringify(await memoryFs.fromJson(JSON.stringify(fsJson)))
        ).toEqual(JSON.stringify(fs))

        expect (await fs.readFile("./home/dne")).toBeNull()
        expect (await fs.readdir("./home/dne")).toBeNull()
})
