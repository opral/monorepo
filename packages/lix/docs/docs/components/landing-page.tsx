import { useState } from "react";

/**
 * Copy icon used for the install command interaction.
 *
 * @example
 * <CopyIcon />
 */
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

/**
 * Check icon shown after the install command is copied.
 *
 * @example
 * <CheckIcon />
 */
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Lix logo used across the landing page.
 *
 * @example
 * <LixLogo className="h-6 w-6" />
 */
const LixLogo = ({ className = "" }) => (
  <svg
    width="30"
    height="22"
    viewBox="0 0 26 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g id="Group 162">
      <path
        id="Vector"
        d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
        fill="#2563EB"
      />
      <path
        id="Vector_2"
        d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
        fill="#2563EB"
      />
      <path
        id="Vector_3"
        d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
        fill="#2563EB"
      />
      <path
        id="Rectangle 391"
        d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
        fill="#2563EB"
      />
    </g>
  </svg>
);

/**
 * Renders the CLI install command with copy interaction.
 *
 * @example
 * <PackageInstaller />
 */
const PackageInstaller = () => {
  const [copied, setCopied] = useState(false);

  const copyFullCommand = () => {
    const command = "npm i @lix-js/sdk";
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex h-11 items-center justify-center gap-3 px-5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 transition-colors duration-200 hover:bg-gray-50">
      <span className="font-mono text-sm leading-none cursor-text select-all">
        npm i @lix-js/sdk
      </span>
      <button
        onClick={copyFullCommand}
        className="h-6 w-6 transition-colors duration-200 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        title="Copy full command"
        aria-label={copied ? "Command copied" : "Copy install command"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
};

/**
 * Landing page for the Lix documentation site.
 *
 * @example
 * <LandingPage />
 */
function LandingPage() {
  return (
    <div className="font-sans text-gray-900 bg-gradient-to-b from-gray-50 to-white">
      {/* Main content */}
      <main className="relative px-4 sm:px-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-18 pb-20 px-4 sm:px-6">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <h1 className="text-gray-900 font-bold leading-tight text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-8">
              Change control SDK for
              <br />
              apps and <span style={{ color: "#0692B6" }}>AI agents</span>
            </h1>

            <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mt-12">
              Lix is a JavaScript SDK that enables Git-like capabilities for
              apps and agents: Change proposals, versioning (branching),
              history, blame, etc.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16  mt-8">
              <a
                href="/guide/getting-started.html"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: "#0692B6", color: "#ffffff" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "#047497";
                  event.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "#0692B6";
                  event.currentTarget.style.color = "#ffffff";
                }}
              >
                Getting started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
              <PackageInstaller />
              <a
                href="https://prosemirror-example.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
              >
                Try an example app
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <a
                href="https://www.npmjs.com/package/@lix-js/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-200"
              >
                <svg
                  className="w-9 h-9 text-red-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0v24h24V0H0zm19.2 19.2h-2.4V9.6h-4.8v9.6H4.8V4.8h14.4v14.4z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  npm
                </span>
                <span className="font-bold text-base text-gray-900">
                  60k+ weekly downloads
                </span>
              </a>

              <a
                href="https://github.com/opral/monorepo/graphs/contributors"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-200"
              >
                <svg
                  className="w-9 h-9 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.645.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  GitHub
                </span>
                <span className="font-bold text-base text-gray-900">
                  100+ contributors
                </span>
              </a>

              <a
                href="https://github.com/opral/monorepo/blob/main/packages/lix/sdk/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-200"
              >
                <svg
                  className="w-9 h-9 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.95-7 10.18-3.87-1.23-7-5.51-7-10.18V6.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  License
                </span>
                <span className="font-bold text-base text-gray-900">
                  MIT Open Source
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* What You Can Build Section */}
        <section className="py-20 bg-gradient-to-r from-gray-50 to-white w-full px-6 sm:px-12 md:px-16 mt-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-24 text-gray-800 flex items-center justify-center">
            <span>What people build with</span>{" "}
            <LixLogo className="ml-2 w-10 h-8 transform translate-y-[-2px]" />
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-14 max-w-[100rem] mx-auto px-4 sm:px-6 mt-16">
            <div className="group cursor-pointer text-center">
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
                {/* ProseMirror Document Editor - Real Screenshot */}
                <div className="w-full h-64 relative overflow-hidden">
                  <img
                    src="/prosemirror.png"
                    alt="ProseMirror editor with Lix version control"
                    className="w-full h-full object-cover"
                    onLoad={() =>
                      console.log("prosemirror.png loaded successfully")
                    }
                    onError={(e) => {
                      console.error("Failed to load prosemirror.png", e);
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.style.backgroundColor = "#f3f4f6";
                        container.style.display = "flex";
                        container.style.alignItems = "center";
                        container.style.justifyContent = "center";
                        container.innerHTML =
                          '<div style="color: #6b7280; font-size: 14px; font-weight: 500;">ProseMirror Demo</div>';
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href="https://prosemirror-example.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-blue-700"
                      style={{ color: "white" }}
                    >
                      Open →
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-gray-800 text-xl font-medium">
                  Prosemirror / TipTap Plugin
                </p>
              </div>
            </div>
            <div className="group cursor-pointer text-center">
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
                {/* Fink App - Real Screenshot */}
                <div className="w-full h-64 relative overflow-hidden">
                  <img
                    src="/fink2.png"
                    alt="Fink localization app with change tracking"
                    className="w-full h-full object-cover"
                    onLoad={() => console.log("fink2.png loaded successfully")}
                    onError={(e) => {
                      console.error("Failed to load fink2.png", e);
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.style.backgroundColor = "#f3f4f6";
                        container.style.display = "flex";
                        container.style.alignItems = "center";
                        container.style.justifyContent = "center";
                        container.innerHTML =
                          '<div style="color: #6b7280; font-size: 14px; font-weight: 500;">Fink Demo</div>';
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href="https://fink2.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-blue-700"
                      style={{ color: "white" }}
                    >
                      Try Live Demo →
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-gray-800 text-xl font-medium">
                  Fink - Translation Editor
                </p>
              </div>
            </div>
            <div className="group cursor-pointer text-center">
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
                {/* GitHub Integration Screenshot */}
                <div className="w-full h-64 relative overflow-hidden">
                  <img
                    src="/flashtype.jpg"
                    alt="Flashtype app with Lix change control"
                    className="w-full h-full object-cover"
                    onLoad={() =>
                      console.log("flashtype.jpg loaded successfully")
                    }
                    onError={(e) => {
                      console.error("Failed to load flashtype.jpg", e);
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.style.backgroundColor = "#f3f4f6";
                        container.style.display = "flex";
                        container.style.alignItems = "center";
                        container.style.justifyContent = "center";
                        container.innerHTML =
                          '<div style="color: #6b7280; font-size: 14px; font-weight: 500;">Flashtype Demo</div>';
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href="https://flashtype.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-blue-700"
                      style={{ color: "white" }}
                    >
                      Try Flashtype →
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-gray-800 text-xl font-medium">
                  Flashtype - AI Markdown Editor
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-16 bg-gradient-to-r from-white to-gray-50 w-full">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-16 text-gray-800">
            Out of the box features
          </h2>

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Feature 1: Traceability */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-16 items-start">
              {/* Left Visual - smaller image */}
              <div className="md:col-span-3">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <img
                    src="/traceability.png"
                    alt="Traceability"
                    className="w-full h-auto max-w-[200px] mx-auto"
                  />
                </div>
              </div>

              {/* Right Content - 70% */}
              <div className="md:col-span-7">
                <h4 className="text-xl font-medium mb-2 text-blue-600">
                  Traceability
                </h4>
                <p className="text-gray-700 text-base mb-1">
                  Enabling versioning in your app.
                </p>
                <p className="text-gray-700 text-base leading-relaxed mb-3">
                  Rollback, branch, or restore any state — even in AI-generated
                  output.
                </p>

                {/* API */}
                <div className="bg-white rounded-md p-2 font-mono text-sm inline-block hover:bg-gray-50 transition-colors cursor-pointer shadow-sm border border-gray-200 mt-2">
                  <a
                    href="https://github.com/opral/monorepo/blob/main/packages/lix/sdk/src/index.ts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <span className="text-amber-600">lix</span>
                    <span className="text-gray-800">.</span>
                    <span className="text-green-600">getHistory</span>
                    <span className="text-blue-600">()</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Feature 2: Diffing */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-16 items-start">
              {/* Left Visual - smaller image */}
              <div className="md:col-span-3">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <img
                    src="/a vs b.png"
                    alt="A vs B Diffing"
                    className="w-full h-auto max-w-[200px] mx-auto"
                  />
                </div>
              </div>

              {/* Right Content - 70% */}
              <div className="md:col-span-7">
                <h4 className="text-xl font-medium mb-2 text-blue-600">
                  Diffing
                </h4>
                <p className="text-gray-700 text-base mb-1">
                  Introduce diffing for your data.
                </p>
                <p className="text-gray-700 text-base leading-relaxed mb-3">
                  AIs make mistakes. With Lix, you can inspect and merge
                  multiple versions together easily.
                </p>

                {/* API */}
                <div className="bg-white rounded-md p-2 font-mono text-sm inline-block hover:bg-gray-50 transition-colors cursor-pointer shadow-sm border border-gray-200 mt-2">
                  <a
                    href="https://github.com/opral/monorepo/blob/main/packages/lix/sdk/src/change-set/get-diff.ts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <span className="text-amber-600">lix</span>
                    <span className="text-gray-800">.</span>
                    <span className="text-green-600">getDiff</span>
                    <span className="text-blue-600">()</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Feature 3: Change Proposals */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-16 items-start">
              {/* Left Visual - smaller image */}
              <div className="md:col-span-3">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <img
                    src="/change proposal.png"
                    alt="Change Proposal"
                    className="w-full h-auto max-w-[200px] mx-auto"
                  />
                </div>
              </div>

              {/* Right Content - 70% */}
              <div className="md:col-span-7">
                <h4 className="text-xl font-medium mb-2 text-blue-600">
                  Change Proposals
                </h4>
                <p className="text-gray-700 text-base mb-1">
                  Build collaboration features with humans & AI agents.
                </p>
                <p className="text-gray-700 text-base leading-relaxed mb-3">
                  Let other people or the AI suggest changes, review and accept
                  them.
                </p>

                {/* API */}
                <div className="bg-white rounded-md p-2 font-mono text-sm inline-block hover:bg-gray-50 transition-colors cursor-pointer shadow-sm border border-gray-200 mt-2">
                  <a
                    href="https://github.com/opral/monorepo/blob/main/packages/lix/sdk/src/change-proposal/create-change-proposal.ts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <span className="text-amber-600">lix</span>
                    <span className="text-gray-800">.</span>
                    <span className="text-green-600">createProposal</span>
                    <span className="text-blue-600">()</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Human-AI Collaboration Section */}
        <section className="py-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-center text-2xl sm:text-3xl font-bold mb-6 text-gray-800 flex items-center justify-center">
              <span>Human and AI collaboration</span>
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16 text-lg">
              Lix provides the foundation for effective human-AI collaboration
              with complete transparency and control over AI-generated changes.
            </p>

            {/* Human-AI Collaboration Wireframe - Compact Version */}
            <div className="max-w-4xl mx-auto mb-10 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row">
                {/* Left panel - AI changes */}
                <div className="w-full sm:w-1/2 p-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        {/* <Bot className="h-5 w-5 text-blue-600" /> */}
                      </div>
                      <span className="font-medium text-sm text-gray-800">
                        AI Changes
                      </span>
                    </div>
                  </div>

                  {/* Simple diff visualization */}
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="h-3 bg-gray-200 rounded w-full mb-1.5"></div>
                    <div className="h-3 bg-red-100 rounded w-3/4 mb-1.5"></div>
                    <div className="h-3 bg-green-100 rounded w-4/5 mb-1.5"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>

                {/* Right panel - Human review */}
                <div className="w-full sm:w-1/2 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                      {/* <User className="h-5 w-5 text-purple-600" /> */}
                    </div>
                    <span className="font-medium text-sm text-gray-800">
                      Human Review
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded px-4 py-2 text-sm font-medium flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Approve
                    </button>
                    <button className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded px-4 py-2 text-sm font-medium flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="https://lix.dev/guide/ai-agent-collaboration.html"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-gray-800 border border-gray-300 px-6 py-3 rounded-md text-base hover:bg-gray-50 transition-all duration-200 inline-flex items-center font-medium shadow-sm"
              >
                Learn more about Human ↔ AI collaboration with{" "}
                <LixLogo className="mx-1 w-5 h-4 transform translate-y-[-1px]" />
              </a>
            </div>
          </div>
        </section>

        {/* Learn More Section */}
        <section className="py-24 border-t border-gray-100 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold mb-10 text-center text-gray-800">
            Ready to enhance your application?
          </h3>
          <p className="text-gray-600 text-lg text-center max-w-xl mx-auto mb-16">
            Join developers who are building the next generation of
            collaborative applications with lix.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a
              href="https://lix.dev/guide/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="h-44 bg-blue-600 text-white rounded-lg p-6 font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg border border-blue-700 flex flex-col justify-between group"
            >
              <span className="text-xl font-semibold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="white"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <span style={{ color: "white" }}>Go to Docs</span>
              </span>
              <div className="flex justify-end">
                <span className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  →
                </span>
              </div>
            </a>
            <a
              href="https://discord.gg/cAby6NTwyT"
              className="h-44 bg-gray-50 text-gray-800 rounded-lg p-6 font-medium hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 flex flex-col justify-between group"
            >
              <span className="text-xl font-semibold">Join Discord</span>
              <div className="flex justify-end">
                <span className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  →
                </span>
              </div>
            </a>
            <a
              href="https://github.com/opral/lix-sdk"
              className="h-44 bg-gray-50 text-gray-800 rounded-lg p-6 font-medium hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 flex flex-col justify-between group"
            >
              <span className="text-xl font-semibold">Visit GitHub</span>
              <div className="flex justify-end">
                <span className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  →
                </span>
              </div>
            </a>
            <a
              href="https://opral.substack.com/"
              className="h-44 bg-gray-50 text-gray-800 rounded-lg p-6 font-medium hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 flex flex-col justify-between group"
            >
              <span className="text-xl font-semibold">Read Substack</span>
              <div className="flex justify-end">
                <span className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  →
                </span>
              </div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
