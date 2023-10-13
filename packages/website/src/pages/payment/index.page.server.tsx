const page = {
	slug: "payment",
	content: {
		title: "Global Payment",
		description: "Enable your customers to pay with ease using their favorite method.",
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
