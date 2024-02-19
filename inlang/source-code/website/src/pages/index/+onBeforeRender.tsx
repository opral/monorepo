import { getNumberOfProjects } from "../../../../rpc/dist/functions/getNumberOfProjects.js"

export default async function onBeforeRender() {
	try {
		const result = await getNumberOfProjects()

		if (result.error) {
			throw new Error(result.error.message)
		}
		const projectCount = result.data
		if (!projectCount) {
			throw new Error("Project count is not defined")
		}
		return {
			pageContext: {
				pageProps: {
					projectCount: projectCount,
				},
			},
		}
	} catch (error) {
		console.error(error)
		return {
			pageContext: {
				pageProps: {
					projectCount: "500+",
				},
			},
		}
	}
}
