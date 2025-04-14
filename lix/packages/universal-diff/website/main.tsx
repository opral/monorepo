import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { TestCases } from "./test-cases.js";
import { DiffPlayground } from "./diff-playground.js";
import { Navbar } from "./navbar.js";
import "./index.css";

function App() {
  const [activePage] = useState<"playground" | "testcases">(
    window.location.pathname === "/testcases" ? "testcases" : "playground",
  );

  const handleNavigate = (page: "playground" | "testcases") => {
    window.location.pathname = page;
  };

  return (
    <div className="max-w-7xl mx-auto my-5 px-5 font-sans">
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      {activePage === "playground" ? <DiffPlayground /> : <TestCases />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
