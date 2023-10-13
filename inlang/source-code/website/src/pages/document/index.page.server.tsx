const page = {
	slug: "document",
	content: {
		title: "Global Document",
		description: "Documents made to collaborate with version control and multi-language support.",
	},
}

export async function onBeforeRender() {
	return {
		pageContext: {
			pageProps: {
				...page,
			},
		},
	}
}
