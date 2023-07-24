import type { LisaClient } from "./api.js"

// --------- (EMULATED) IMPORTS ----------
const { load }: LisaClient = {} as any
const { createMemoryFs, nodeFs } = {} as any

// --------- START OF APP ----------

const memoryFs = createMemoryFs()

// -- loading multiple repositories is possible

// -- (FUTURE) loading a local repository is possible
const localRepository = await load("/home/foo/bar.git", { fs: nodeFs })

// -- loading a remote repository is possible
//    - uses lisa.dev which acts as a proxy to github.com. Legacy git hosts don't support
//      all features we need like lazy fetching, auth, etc.
const repository = await load("https://fis.dev/github.com/foo/bar.git", {
	fs: memoryFs,
	// todo auth is not yet implemented
	auth: { username: "foo", password: "bar" },
})

// -- file is lazy fetched upon first access
let file = await repository.fs.readFile("foo.txt")

// modifying the file
file += "bar"

await repository.fs.writeFile("foo.txt", file)

const status = await repository.status()

if (status.hasChanges) {
	await repository.commit()
	await repository.push()
}
