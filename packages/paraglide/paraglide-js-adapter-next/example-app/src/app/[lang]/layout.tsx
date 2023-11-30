import ParaglideNextAdapter from "@/ParaglideNextAdapter"
import { languageTag } from "@/paraglide/runtime"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	//The ParaglideNextAdapter component needs to come before any use of the `languageTag` function
	return (
		<ParaglideNextAdapter>
			<html lang={languageTag()}>
				<body>{children}</body>
			</html>
		</ParaglideNextAdapter>
	)
}
