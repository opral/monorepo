import { getI18nContext } from "../inlang.js"

export const clientFn = () => {
	const { i } = getI18nContext()
	console.info("utils/client.ts", i("welcome"))
}
