import { message0 } from "../paraglide/messages.js";

export function Page() {
	return `
    <p>${message0()}</p>
    <a href="/about">Go to the about page</a>
  `;
}
