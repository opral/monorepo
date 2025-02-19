import { m } from "./paraglide/messages.js";
import { setLocale } from "./paraglide/runtime.js";

function App() {
	return (
		<div>
			<button onClick={() => setLocale("en")}>Switch locale to en</button>
			<button onClick={() => setLocale("de")}>Switch locale to de</button>
			<button onClick={() => setLocale("fr")}>Switch locale to fr</button>
			<p>
				{m.jojo_mountain_day({
					username: "John Doe",
					platform: "ios",
					userGender: "male",
				})}
			</p>
		</div>
	);
}

export default App;
