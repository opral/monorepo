import { useState } from "react"

export default function App() {
	const [name, setName] = useState("Unknown")

	return (
		<>
			<label>
				Your name:
				<input name="firstName" onChange={(e) => setName(e.target.value)} />
			</label>

			<p className="text-red-500">Your name is {name}</p>
		</>
	)
}
