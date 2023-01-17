export { Page };
function Page(pageProps) {
	if (pageProps.is404) {
		console.log(pageProps.is404, "is a 404");
		return <sl-button> error 404</sl-button>;
		// Return a UI component "Page Not Found."
	} else {
		console.log(pageProps, "is not 404");

		// Return a UI component "Our server is having problems. Sincere apologies. Try again later."
	}
}
