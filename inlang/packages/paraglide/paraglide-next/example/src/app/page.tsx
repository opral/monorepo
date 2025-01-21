import * as m from "./paraglide/messages";

export default function Home() {
	return <p>{m.example_message({ username: "Samuel" })}</p>;
}
