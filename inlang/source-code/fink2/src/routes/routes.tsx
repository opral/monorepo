import { RouteObject } from "react-router-dom"
import IndexPage from "./index/Page.tsx"
import SettingsPage from "./settings/Page.tsx"

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <IndexPage />,
	},
	{
		path: "/settings",
		element: <SettingsPage />,
	},
]
