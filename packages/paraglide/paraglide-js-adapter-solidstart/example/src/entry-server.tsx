import { createHandler, StartServer } from "@solidjs/start/server"
import * as i18n from "./i18n"

export default createHandler(() => {
	const language_tag = i18n.useLocationLanguageTag() ?? i18n.sourceLanguageTag

	return (
		<StartServer
			document={(props) => (
				<html lang={language_tag}>
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
						<i18n.AlternateLinks languageTag={language_tag} />
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
