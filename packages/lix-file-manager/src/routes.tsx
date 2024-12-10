import { RouteObject } from "react-router-dom";
import IndexPage from "./routes/index/Page.tsx";
import AutomationPage from "./routes/automation/Page.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <IndexPage />,
	},
	{
		path: "/automation",
		element: <AutomationPage />,
	},
];
