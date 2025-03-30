import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { testCases } from "../src/test-cases.js";
import { TestCaseCard } from "./test-case-card";
import { DiffPlayground } from "./diff-playground";
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
      {/* Add the DiffPlayground component above the test cases */}
      <DiffPlayground />
      
      <h2 className="text-xl font-bold mb-4 mt-8">Test Cases</h2>
      <input
        type="search"
        placeholder="Filter by name..."
        value={searchTerm}
        onChange={handleSearchInput}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <div className="test-cases">
        {filteredCases.map((tc) => (
          <React.Fragment key={tc.name}>
            <TestCaseCard testCase={tc} />
            <hr className="my-6 border-gray-200" />
          </React.Fragment>
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
