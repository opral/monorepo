import { RouteObject } from "react-router-dom";
import RootLayout from "./layouts/RootLayout.tsx";

import IndexPage from "./routes/index/Page.tsx";
import AutomationPage from "./routes/automation/Page.tsx";
import ShadcnPage from "./routes/shadcn/Page.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: (
			<RootLayout>
				<IndexPage />
			</RootLayout>
		),
	},
	{
		path: "/automation",
		element: (
			<RootLayout>
				<AutomationPage />
			</RootLayout>
		),
	},
	{
		path: "/shadcn",
		element: (
			<RootLayout>
				<ShadcnPage />
			</RootLayout>
		),
	},
];
