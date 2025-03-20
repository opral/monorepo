import IconSearch from "~icons/material-symbols/search-rounded";
import { currentPageContext } from "#src/renderer/state.js";
import { createSignal } from "solid-js";
import { navigate } from "vike/client/router";
import * as m from "#src/paraglide/messages.js";

// Make search input available to other components so it can get cleared
export const [searchInput, setSearchInput] = createSignal<string>("");

export const handleNavigate = () => {
	if (searchInput() !== "")
		window.history.pushState({}, "", "/search?q=" + searchInput());
	// @ts-ignore
	if (searchInput() === "") navigate("/search");
	// @ts-ignore
	else navigate("/search?q=" + searchInput());
};

export default function SearchBar() {
	let inputElement: any;
	const { q } = currentPageContext.urlParsed.search;

	if (typeof window !== "undefined")
		window.addEventListener("keydown", (e) => {
			if (
				e.key === "/" &&
				document.activeElement!.tagName !== "INPUT" &&
				document.activeElement!.tagName !== "INLANG-BADGE-GENERATOR"
			) {
				e.preventDefault();
				inputElement.focus();
			} else window.removeEventListener("keydown", () => {});
		});

	return (
		<div></div>
		// <form
		// 	class="group relative flex justify-center gap-1 px-3 items-center border h-8 w-full py-0.5 rounded-lg transition-all duration-150 bg-background border-surface-200 focus-within:border-primary"
		// 	onSubmit={(e) => {
		// 		e.preventDefault();
		// 		handleNavigate();
		// 	}}
		// >
		// 	<input
		// 		type="text"
		// 		aria-label="search input"
		// 		id="search"
		// 		name="search"
		// 		autocomplete="off"
		// 		placeholder={"/ " + m.marketplace_header_search_placeholder()}
		// 		class="border-0 focus:ring-0 h-full w-full pl-0 text-sm placeholder:text-surface-500 transition-all"
		// 		value={q ? q : searchInput()}
		// 		ref={inputElement}
		// 		onInput={(e) => {
		// 			setSearchInput(e.target.value);
		// 		}}
		// 	/>
		// 	<button type="submit" aria-label="submit search">
		// 		<IconSearch class="-mr-0.5 transition-color duration-150 group-focus-within:text-primary text-surface-400" />
		// 	</button>
		// </form>
	);
}
