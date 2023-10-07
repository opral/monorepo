import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import ParaglideProvider from "./ParaglideProvider"

ReactDOM.createRoot(document.getElementById("root")).render(
	// <React.StrictMode>
	<ParaglideProvider>
		<App />
	</ParaglideProvider>
	// </React.StrictMode>
)
