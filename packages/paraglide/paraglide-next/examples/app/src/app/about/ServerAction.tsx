"use client";
import { fetchData } from "../actions";

export default function ServerActionTester() {
  return (
    <button
      onClick={async () => {
        const response = await fetchData();
        alert(response);
      }}
      type="button"
    >
      Trigger Server Action
    </button>
  );
}
