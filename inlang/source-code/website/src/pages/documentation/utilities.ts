export function extractedHeadings(markdown: any) {
	markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g).map((heading: string) => {
		return heading.replace(/(<([^>]+)>)/gi, "")
	})
}
