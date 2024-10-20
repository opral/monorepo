export const replaceMetaInfo = (pageContext: Record<string, any>) => {
  if (document) {
    (document.title =
      pageContext.urlParsed.pathname === "/"
        ? "Fink Project Launcher for Translators"
        : pageContext.urlParsed.pathname.split("/")[2] +
          " / " +
          pageContext.urlParsed.pathname.split("/")[3] +
          " | Fink Project Launcher"),
      document
        .querySelector('meta[name="description"]')!
        .setAttribute(
          "content",
          pageContext.urlParsed.pathname === "/"
            ? "Fink is an localization editor for managing translations of your application."
            : `Fink is an localization editor for managing translations of your application. Edit ${
                pageContext.urlParsed.pathname.split("/")[2]
              } / ${pageContext.urlParsed.pathname.split("/")[3]} translations here.`,
        );
  }
};
