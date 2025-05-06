import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes.tsx";
import { App } from "./layouts/AppLayout.tsx";

const router = createBrowserRouter(
	routes.map((route) => ({
		...route,
		element: (
			<App>{route.element} </App>
		),
	})),
	{
		// in case the app is running one lix origin
		basename: window.location.pathname.startsWith("/app/flashtype")
			? "/app/flashtype"
			: undefined,
	}
);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
