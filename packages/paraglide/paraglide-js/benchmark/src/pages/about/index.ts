import { m } from "../../paraglide/messages.js";

export function Page() {
	return `
    <p>${m.message1()}</p>
    <a href="/${process.env.BASE}">Go back to the homepage</a>
  `;
}
