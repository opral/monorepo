import { RouteObject } from "react-router-dom";
import IndexPage from "./index/Page.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <IndexPage />,
	},
];
