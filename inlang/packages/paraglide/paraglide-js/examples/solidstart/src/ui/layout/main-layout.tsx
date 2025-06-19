import { MetaProvider } from "@solidjs/meta"
import type { ParentComponent } from "solid-js"

import MainHeader from "./main-header"

const MainLayout: ParentComponent = (props) => {
	return (
		<MetaProvider>
			<div>
				<MainHeader />
				<main>
					{props.children}
				</main>
			</div>
		</MetaProvider>
	)
}

export default MainLayout