import { remark } from "remark"
import remarkHTML from "remark-html"

export async function convert(markdownContent: string): Promise<string> {
	const content = await remark().use(remarkHTML).process(markdownContent)
	return content.toString()
}
