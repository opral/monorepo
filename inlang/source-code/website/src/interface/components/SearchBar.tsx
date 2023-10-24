import IconSearch from "~icons/material-symbols/search-rounded"
import { currentPageContext } from "#src/renderer/state.js"
import { createSignal } from "solid-js"
import { navigate } from "vite-plugin-ssr/client/router"

export default function SearchBar() {
	const [searchInput, setSearchInput] = createSignal<string>("")
	const { q } = currentPageContext.urlParsed.search

	const handleNavigate = () => {
		if (!currentPageContext.routeParams.category) {
			if (searchInput() !== "") window.history.pushState({}, "", "/search?q=" + searchInput())
			// @ts-ignore
			if (searchInput() === "") navigate("/search")
			// @ts-ignore
			else navigate("/search?q=" + searchInput())
		} else {
			if (searchInput() !== "")
				window.history.pushState(
					{},
					"",
					"/c/" + currentPageContext.routeParams.category + "?q=" + searchInput()
				) // @ts-ignore
			if (searchInput() === "") navigate("/c/" + currentPageContext.routeParams.category)
			// @ts-ignore
			else navigate("/c/" + currentPageContext.routeParams.category + "?q=" + searchInput())
		}
	}

	return (
		<form
			class="group flex justify-center gap-1 px-3 items-center border h-8 w-full py-0.5 rounded-full transition-all duration-150 bg-background border-surface-200 focus-within:border-primary"
			onSubmit={(e) => {
				e.preventDefault()
				handleNavigate()
			}}
		>
			<input
				type="text"
				aria-label="search input"
				id="search"
				name="search"
				placeholder="Search"
				class="border-0 focus:ring-0 h-full w-full pl-0 text-sm"
				value={q ? q : searchInput()}
				onInput={(e) => {
					setSearchInput(e.target.value)
				}}
			/>
			<button type="submit" aria-label="submit search">
				<IconSearch class="ml-1.5 transition-color duration-150 group-focus-within:text-primary" />
			</button>
		</form>
	)
}
