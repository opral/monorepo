import cheerio from "cheerio"

export const generateTableOfContents = async (markdown: any) => {
	const table = {}

	if (
		markdown &&
		markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g) &&
		markdown.match(/<h[1].*?>(.*?)<\/h[1]>/g)
	) {
		const headings = markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)

		for (const heading of headings) {
			const $ = cheerio.load(heading)
			const text = $("h1, h2, h3").text()

			if (text) {
				if ($("h1").length > 0) {
					// @ts-ignore
					table[text.replace(/(<([^>]+)>)/gi, "").replace("#", "")] = []
				} else if (Object.keys(table).length > 0) {
					const lastH1Key = Object.keys(table).pop()
					// @ts-ignore
					table[lastH1Key].push(text.replace(/(<([^>]+)>)/gi, "").replace("#", ""))
				}
			}
		}
	}

	return table
}
