import { RouteObject } from "react-router-dom"
import IndexPage from "./routes/index/Page.tsx"
import OtherPage from "./routes/other/Page.tsx"

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
