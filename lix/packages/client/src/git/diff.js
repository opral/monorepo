import isoGit from "../../vendored/isomorphic-git/index.js"

// @ts-ignore
export async function getFileStateChanges(ctx, commitA, commitB) {
	return isoGit.walk({
		fs: ctx.rawFs,
		dir: ctx.dir,
		trees: [isoGit.TREE({ ref: commitA }), isoGit.TREE({ ref: commitB })],
		map: async function (filepath, [A, B]) {
			// ignore directories
			if (filepath === ".") {
				return
			}
			if ((await A?.type()) === "tree" || (await B?.type()) === "tree") {
				return
			}

			// generate ids
			const Aoid = await A?.oid()
			const Boid = await B?.oid()

			// determine modification type
			let type = "equal"
			if (Aoid !== Boid) {
				type = "modify"
			}
			if (Aoid === undefined) {
				type = "add"
			}
			if (Boid === undefined) {
				type = "remove"
			}
			if (Aoid === undefined && Boid === undefined) {
				console.log("Something weird happened:")
				console.log(A)
				console.log(B)
			}

			return {
				path: `/${filepath}`,
				type: type,
			}
		},
	})
}
