import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes/routes.tsx";
import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
import { posthog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

posthog.init(import.meta.env.PUBLIC_POSTHOG_TOKEN ?? "", {
	api_host: import.meta.env.PROD ? "https://tm.inlang.com" : "http://localhost:4005",
});

setBasePath("https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.16.0/cdn/");

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<PostHogProvider client={posthog}>
			<RouterProvider router={router} />
		</PostHogProvider>
	</React.StrictMode>
);
