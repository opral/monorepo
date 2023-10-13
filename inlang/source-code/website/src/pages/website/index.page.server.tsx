const page = {
	slug: "website",
	content: {
		title: "Global Website",
		description: "Let your website speak the language of your customers.",
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
