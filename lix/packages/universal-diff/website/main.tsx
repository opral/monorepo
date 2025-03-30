import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { testCases } from "../src/test-cases.js";
import { TestCaseCard } from "./test-case-card";
import "./index.css"; // Import index.css

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCases = testCases.filter((tc) =>
    tc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleSearchInput(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  return (
    <div className="max-w-4xl mx-auto my-5 font-sans px-4">
      <h1 className="text-2xl font-bold mb-4">
        Lix Universal Diff - Test Cases
      </h1>
      <input
        type="search"
        placeholder="Filter by name..."
        value={searchTerm}
        onChange={handleSearchInput}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <div className="test-cases">
        {filteredCases.map((tc) => (
          <TestCaseCard key={tc.name} testCase={tc} />
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
