const page = {
	slug: "application",
	content: {
		title: "Global Application",
		description: "Globalization infrastructure for software",
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
