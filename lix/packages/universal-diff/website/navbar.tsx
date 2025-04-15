import React from "react";

interface NavbarProps {
  activePage: "home" | "playground" | "testcases";
  onNavigate: (page: "home" | "playground" | "testcases") => void;
}

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  return (
    <nav className="mb-6">
      <div className="flex space-x-6 pb-3">
        <a
          href="#home"
          className={`${
            activePage === "home"
              ? "font-medium"
              : "font-normal hover:text-blue-500"
          }`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
        >
          Home
        </a>
        <a
          href="#playground"
          className={`${
            activePage === "playground"
              ? "font-medium"
              : "font-normal hover:text-blue-500"
          }`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("playground");
          }}
        >
          Playground
        </a>
        <a
          href="#testcases"
          className={`${
            activePage === "testcases"
              ? "font-medium"
              : "font-normal hover:text-blue-500"
          }`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("testcases");
          }}
        >
          Test Cases
        </a>
      </div>
      <hr className="border-gray-200" />
    </nav>
  );
}
