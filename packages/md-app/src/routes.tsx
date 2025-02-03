import { RouteObject } from "react-router-dom";
import IndexPage from "./routes/index/Page.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <IndexPage />,
	},
];
