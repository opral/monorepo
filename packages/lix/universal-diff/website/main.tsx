import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { TestCases } from "./test-cases.js";
import { DiffPlayground } from "./diff-playground.js";
import { Navbar } from "./navbar.js";
import { ReadmeHome } from "./readme-home.js";
import { Showcase } from "./showcase/index.js";
import "./index.css";

function App() {
  const [activePage] = useState<
    "home" | "playground" | "testcases" | "showcase"
  >(
    window.location.pathname === "/testcases"
      ? "testcases"
      : window.location.pathname === "/playground"
        ? "playground"
        : window.location.pathname === "/showcase"
          ? "showcase"
          : "home",
  );

  const handleNavigate = (
    page: "home" | "playground" | "testcases" | "showcase",
  ) => {
    window.location.pathname = page === "home" ? "/" : `/${page}`;
  };

  return (
    <div className="max-w-7xl mx-auto my-5 px-5 font-sans">
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      {activePage === "home" && <ReadmeHome />}
      {activePage === "playground" && <DiffPlayground />}
      {activePage === "testcases" && <TestCases />}
      {activePage === "showcase" && <Showcase />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
