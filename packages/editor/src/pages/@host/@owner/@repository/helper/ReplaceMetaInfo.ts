export const replaceMetaInfo = (pageContext: Record<string, any>) => {
	if (document)
		document.title =
			pageContext.urlParsed.pathname === "/"
				? "Fink - i18n Message Editor"
				: pageContext.urlParsed.pathname.split("/")[2] + " | Fink - i18n Message Editor"
}
