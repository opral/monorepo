import { useState } from "react"
import { Link } from "react-router-dom"

export default function App() {
	const [name, setName] = useState("Unknown")

	return (
		<>
			<label>
				Your name:
				<input name="firstName" onChange={(e) => setName(e.target.value)} />
			</label>

			<p className="text-red-500">Your name is {name}</p>
			<Link to="/other">go to other</Link>
		</>
	)
}
