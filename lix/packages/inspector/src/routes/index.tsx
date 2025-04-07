import { Link } from "react-router";

export default function Route() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <Link to="/about">Go to About</Link>
    </div>
  );
}
