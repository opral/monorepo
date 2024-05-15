export function generateJSDoc(docs: {
	description?: string
	params?: {
		[input: string]: {
			type: string
			description?: string
		}
	}
	returns?: {
		type?: string
		description?: string
	}
}): string {
	const sections: (string | undefined)[] = [
		docs.description,
		Object.entries(docs.params || {})
			.map(([name, { type, description }]) => {
				const lines = type.split("\n")
				const parts = ["@param", `{${lines.join("\n\t")}}`, name, description].filter(Boolean)
				return parts.join(" ")
			})
			.join("\n"),
		docs.returns
			? [
					"@returns",
					docs.returns.type ? `{${docs.returns.type.split("\n").join("\n\t")}}` : undefined,
					docs.returns.description,
			  ]
					.filter(Boolean)
					.join(" ")
			: undefined,
	].filter(Boolean)

	const body = sections.join("\n\n")

	const lines = body.split("\n")
	const multiline = lines.length > 1

	return multiline ? `/**\n * ${lines.join("\n * ")}\n */` : `/** ${body} */`
}
