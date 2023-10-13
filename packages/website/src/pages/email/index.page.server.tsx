const page = {
	slug: "email",
	content: {
		title: "Global Email",
		description: "Stay in touch with your customers in their native language.",
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
