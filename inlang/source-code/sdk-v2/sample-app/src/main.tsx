/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "./style.css"
import { createRoot } from "react-dom/client"
import { PageView } from "./PageView.js"

import "@inlang/bundle-component"

document.querySelector<HTMLDivElement>(
	"#app"
)!.innerHTML = `<div id="root" style="height: 100%"></div>`

const domNode = document.getElementById("root")
const root = createRoot(domNode!)
//root.render(<MessageBundleList />)
// const isInIframe = window.self !== window.top

// if (isInIframe) {
// 	const { MainViewIframe } = await import("./mainViewIframe.js")
// 	root.render(
// 		<MainViewIframe
// 			projectPath={new URLSearchParams(window.location.search).get("inlangProjectPath")!}
// 		/>
// 	)
// } else {
root.render(<PageView />)
// }
