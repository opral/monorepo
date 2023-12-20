export const replaceMetaInfo = (pageContext: Record<string, any>) => {
	if (document) {
		;(document.title =
			pageContext.urlParsed.pathname === "/"
				? "Fink - i18n Message Editor"
				: pageContext.urlParsed.pathname.split("/")[2] +
				  " / " +
				  pageContext.urlParsed.pathname.split("/")[3] +
				  " | Fink - i18n Message Editor"),
			document
				.querySelector('meta[name="description"]')!
				.setAttribute(
					"content",
					pageContext.urlParsed.pathname === "/"
						? "Fink is an i18n message editor for managing translations of your application."
						: `Fink is an i18n message editor for managing translations of your application. Edit ${
								pageContext.urlParsed.pathname.split("/")[2]
						  } / ${pageContext.urlParsed.pathname.split("/")[3]} translations here.`
				)
	}
}
