import { defineGetLocale, assertIsLocale } from "./runtime.js";
import { headers } from "next/headers";

/**
 * Defines `getLocale()` on the server.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The child components to be rendered within the provider.
 * @returns {JSX.Element}
 */
export default function ParaglideProvider({ children }) {
	defineGetLocale(() => {
		// @ts-ignore
		return assertIsLocale(headers().get("x-paraglide-locale"));
	});

	return <>{children}</>;
}
