import { m } from "../../paraglide/messages.js";

export function Page() {
	return `
    <p>${m.message0()}</p>
    <a href="/">Go back to the homepage</a>
  `;
}
