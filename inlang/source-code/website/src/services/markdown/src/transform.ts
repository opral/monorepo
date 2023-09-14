import { remark } from "remark"
import remarkRehype from "remark-rehype"

export async function convert(markdown: string): Promise<string> {
	const content = await remark().use(remarkRehype).process(markdown)
	return content.toString()
}
