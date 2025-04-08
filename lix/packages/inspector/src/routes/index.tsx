import { useKeyValue } from "../hooks/use-key-value.ts";

export default function Route() {
  const [id] = useKeyValue("lix_id");

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <p>ID: {id}</p>
    </div>
  );
}
