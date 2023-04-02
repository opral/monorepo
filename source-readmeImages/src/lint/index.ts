// // todo
// const results = {}

import { http, raw } from "../api/index.js"
import { fs } from "memfs"
// // ---------------

// if (results['inlang/inlang'].time < h24ago){

// }
await raw.clone({
	fs: fs,
	http,
	dir: "/",
	url: `https://github.com/inlang/inlang`,
	singleBranch: true,
	depth: 1,
})

// const file = await fs.readFile("/inlang.config.js")
// const { defineConfig } = await import(file)
// const config = await defineConfig()
// results['inlang/inlang'] = {r: lint(config), time: Date.now()}

// const html = <Image {result}></Image>

// response.send(renderToImage(html))
async function cloneRepository(args: { fs: typeof import("memfs").fs }): Promise<Date | undefined> {
	// do shallow clone, get first commit and just one branch
	await raw.clone({
		fs: args.fs,
		http,
		dir: "/",
		url: `https://github.com/inlang/inlang`,
		singleBranch: true,
		depth: 1,
	})

	// triggering a side effect here to trigger a re-render
	// of components that depends on fs
	const date = new Date()
	return date
}
cloneRepository({ fs })
const file = await fs.readFile("/inlang.config.js", cloneRepository({ fs }))
console.log("123", file)
