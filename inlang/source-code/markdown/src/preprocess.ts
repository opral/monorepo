/**
 * Does basic string-preprocessing of the markdown
 */
export function preprocess(markdown: string): string {
	return (
		markdown
			// If a # is followed by a nbsp, replace it with a regular space
			// It's inconsitent between renderers if nbsps are allowed there or not
			// this causes inconsistencies on the website
			.replaceAll("#\u{00a0}", "# ")

			// Some emojis can't be rendered in the font the website provides, therefore presanitization is needed
			.replaceAll("1️⃣", "1")
			.replaceAll("2️⃣", "2")
			.replaceAll("3️⃣", "3")
			.replaceAll("4️⃣", "4")
			.replaceAll("5️⃣", "5")
	)
}
