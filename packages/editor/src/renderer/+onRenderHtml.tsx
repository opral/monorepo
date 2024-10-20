import type { PageContextRenderer } from "./types.js";
import { escapeInject, dangerouslySkipEscape } from "vike/server";
import { setCurrentPageContext } from "./state.js";

// import the css
import "./app.css";

// See https://vike.dev/data-fetching
export const passToClient = [
  "pageProps",
  "routeParams",
  "languageTag",
] as const;

export default async function onRenderHtml(
  pageContext: PageContextRenderer,
): Promise<unknown> {
  //! TODO most likely cross request state pollution
  //! Need to look into this in the future
  setCurrentPageContext(pageContext);

  const metaInfo = {
    title:
      pageContext.urlParsed.pathname === "/"
        ? "Fink Project Launcher for Translators"
        : pageContext.urlParsed.pathname.split("/")[2] +
          " / " +
          pageContext.urlParsed.pathname.split("/")[3] +
          " | Fink Project Launcher for Translators",
    description:
      pageContext.urlParsed.pathname === "/"
        ? "Fink is an localization editor for managing translations of your application."
        : `Fink is an localization editor for managing translations of your application. Edit ${
            pageContext.urlParsed.pathname.split("/")[2]
          } / ${pageContext.urlParsed.pathname.split("/")[3]} translations here.`,
  };

  return escapeInject`<!DOCTYPE html>
    <html lang="en" class="min-h-screen min-w-screen">
      <head>
	  		<title>${dangerouslySkipEscape(metaInfo.title)}</title>
			<meta name="description" content="${dangerouslySkipEscape(metaInfo.description)}" />
			<meta name="og:image" content="/images/fink-social-image.jpg" />
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
		<!-- theme-color means the background color of the iOS status bar -->
			<meta name="theme-color" content="#000000" />
		<!-- START import inter font -->
			<link rel="preconnect" href="https://rsms.me/">
			<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
		<!-- END import inter font -->
			${dangerouslySkipEscape(import.meta.env.PROD ? analytics : "")}
			${dangerouslySkipEscape(favicons)}
      </head>
	  <!-- setting min-h/w-screen to allow child elements to span to the entire screen  -->
      <body class="editor min-h-screen min-w-screen bg-surface-50 text-on-background" id="root">
		    ${""}
      </body>
    </html>`;
}

const favicons = `
<link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
<link rel="manifest" href="/favicon/site.webmanifest">
<link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5">
<meta name="msapplication-TileColor" content="#da532c">
<meta name="theme-color" content="#ffffff">
`;

const analytics = `
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5H3SDF7TVZ"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-5H3SDF7TVZ');
</script>
`;
