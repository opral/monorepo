import { remark } from "remark"
import html from "remark-html"

export async function convert(markdown: string): Promise<string> {
	const content = await remark().use(html).process(markdown)
	return content.toString()
}
