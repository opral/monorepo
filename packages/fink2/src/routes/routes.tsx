import { RouteObject } from "react-router-dom"
import IndexPage from "./index/Page.tsx"
import OtherPage from "./other/Page.tsx"

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <IndexPage />,
	},
	{
		path: "/other",
		element: <OtherPage />,
	},
]
