// render the initial page
render(window.location.pathname);

// simulating client-side routing
// when a link is clicked, prevent the default behavior
// and re-render the app instead
document.addEventListener("click", (event) => {
	const target = event.target as HTMLElement;
	// intercept <a> tag clicks
	if (target.tagName === "A") {
		event.preventDefault();
		// update the URL and re-render the app
		const pathname = target.getAttribute("href")!;
		history.pushState(null, "", pathname);
		render(pathname);
	}
});

async function render(pathname: string) {
	let page: () => string;

	const path = pathname.replace(process.env.BASE!, "").replaceAll("//", "/");

	// rootpath
	if (path === "/") {
		const { Page } = await import("./pages/index.js");
		page = Page;
	} else if (path === "/about") {
		const { Page } = await import("./pages/about/index.js");
		page = Page;
	} else {
		throw new Error("Unknown page");
	}
	document.getElementById("root")!.innerHTML = page();
}
