import { createHandler, StartServer } from "@solidjs/start/server"
import * as i18n from "./i18n"

export default createHandler(() => {
	const url_language_tag = i18n.useLocationLanguageTag()
	const language_tag = url_language_tag ?? i18n.sourceLanguageTag

	return (
		<StartServer
			document={(props) => (
				<html lang={language_tag}>
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
						{props.assets}
					</head>
					<body>
						<div id="app">{props.children}</div>
						{props.scripts}
					</body>
				</html>
			)}
		/>
	)
})
