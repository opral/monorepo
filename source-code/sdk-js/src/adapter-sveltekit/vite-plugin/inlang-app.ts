import { createInlang } from '@inlang/app'
import { InlangSdkException } from './exceptions.js'
import type { NodeishFilesystem } from '@inlang-git/fs'

export const initInlangApp = async () => {
	const app = await createInlang({ nodeishFs: await getFs(), configPath: './inlang.config.json' })
	console.log(123, app);

}


const getFs = () => import("node:fs/promises").catch(
	() =>
		new Proxy({} as NodeishFilesystem, {
			get: (target, key) => {
				if (key === "then") return Promise.resolve(target)

				return () => {
					throw new InlangSdkException(
						"`node:fs/promises` is not available in the current environment",
					)
				}
			},
		}),
)