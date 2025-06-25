import { useState } from "react";

// Copy icon component
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
);

// Check icon component
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

// Lix logo component
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

// Package installer component
const PackageInstaller = () => {
  const [copied, setCopied] = useState(false);

  const copyFullCommand = () => {
    const command = "npm install @lix-js/sdk";
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <div className="bg-white text-gray-800 px-4 rounded-md font-mono text-sm flex items-center w-full sm:w-auto justify-between space-x-4 border border-gray-200 shadow-sm h-10">
        <div className="flex items-center h-full">
          <span className="text-gray-500 mr-1 select-none">npm install</span>
          <span className="text-blue-600 tracking-wide cursor-text select-all">
            @lix-js/sdk
          </span>
        </div>
        <button
          onClick={copyFullCommand}
          className="h-full px-1.5 transition-colors duration-200 flex-shrink-0 cursor-pointer flex items-center justify-center min-w-[28px] text-gray-500 hover:text-gray-700"
          title="Copy full command"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="font-sans text-gray-900 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Navigation */}
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
        <a
          href="/"
          className="text-blue-600 font-medium text-lg lowercase transition-transform hover:scale-105 flex items-center"
        >
          <LixLogo />
        </a>
        <div className="flex space-x-6">
          <a
            href="https://github.com/opral/monorepo/tree/main/packages/lix-sdk/src"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 text-base lowercase flex items-center gap-1 border-b-2 border-transparent hover:border-blue-500 hover:text-blue-600 transition-all duration-200 px-2 py-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            docs
          </a>
          <a
            href="https://github.com/opral/lix-sdk"
            className="text-gray-600 text-base lowercase flex items-center gap-1 border-b-2 border-transparent hover:border-blue-500 hover:text-blue-600 transition-all duration-200 px-2 py-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.683-.217.683-.481 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.645.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"
                clipRule="evenodd"
              />
            </svg>
            github
          </a>
          <a
            href="https://discord.gg/cAby6NTwyT"
            className="text-gray-600 text-base lowercase flex items-center gap-1 border-b-2 border-transparent hover:border-blue-500 hover:text-blue-600 transition-all duration-200 px-2 py-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
            discord
          </a>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative px-4 sm:px-6">
        {/* Hero Section */}
        <section className="py-28 text-center max-w-3xl mx-auto">
          <h1 className="text-gray-900 text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Enable change control
            <br />
            in your app or agent
          </h1>

          <p className="text-gray-600 max-w-xl mx-auto mb-12 text-xl leading-relaxed">
            Build versioned workflows, AI proposals, diffs, and review UIs with
            one SDK. Designed for modern collaborative applications.
          </p>

          {/* Command and buttons in one row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <PackageInstaller />

            <a
              href="https://github.com/opral/monorepo/tree/main/packages/lix-sdk/examples"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-2 rounded-md text-base hover:bg-blue-700 transition-all duration-200 flex items-center font-medium group shadow-sm"
            >
              <span className="flex items-center">
                Try a demo app
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 group-hover:ml-3 transition-all duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* NPM Downloads */}
            <a
              href="https://www.npmjs.com/package/@lix-js/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <svg
                className="w-5 h-5 text-red-500"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0v24h24V0H0zm19.2 19.2h-2.4V9.6h-4.8v9.6H4.8V4.8h14.4v14.4z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                27k+ monthly downloads
              </span>
            </a>

            {/* GitHub Contributors */}
            <a
              href="https://github.com/opral/monorepo/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.645.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                100+ contributors
              </span>
            </a>

            {/* MIT License */}
            <a
              href="https://github.com/opral/monorepo/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.95-7 10.18-3.87-1.23-7-5.51-7-10.18V6.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                MIT Open Source
              </span>
            </a>
          </div>
        </section>

        {/* What You Can Build Section */}
        <section className="py-20 bg-gradient-to-r from-gray-50 to-white w-full px-6 sm:px-12 md:px-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12 text-gray-800 flex items-center justify-center">
            <span>What you can build with</span>{" "}
            <LixLogo className="ml-2 w-10 h-8 transform translate-y-[-2px]" />
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-14 max-w-[100rem] mx-auto px-4 sm:px-6">
            <div className="group cursor-pointer text-center">
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
                {/* Markdown Document Editor UI - Enhanced */}
                <div className="w-full h-64 lg:h-auto lg:aspect-[3/2] relative">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 bg-white p-4 border-r border-gray-100">
                      {/* Document Editor Toolbar */}
                      <div className="flex space-x-1 mb-3">
                        <div className="h-5 w-5 bg-gray-200 rounded flex items-center justify-center">
                          <div className="h-3 w-3 bg-gray-400 rounded"></div>
                        </div>
                        <div className="h-5 w-5 bg-gray-200 rounded flex items-center justify-center">
                          <div className="h-2 w-3 bg-gray-400 rounded"></div>
                        </div>
                        <div className="h-5 w-5 bg-gray-200 rounded flex items-center justify-center">
                          <div className="h-1 w-3 bg-gray-400 rounded"></div>
                        </div>
                        <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center">
                          <div className="h-1 w-3 bg-white rounded"></div>
                        </div>
                        <div className="ml-1 h-5 px-2 bg-gray-700 rounded text-white text-[8px] flex items-center">
                          VERSION 1
                        </div>
                      </div>

                      {/* Document Content */}
                      <div className="h-5 w-3/4 bg-gray-700 rounded mb-3 flex items-center px-2">
                        <div className="h-2 w-full bg-gray-600 rounded"></div>
                      </div>
                      <div className="h-3 w-full bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 w-5/6 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 w-11/12 bg-gray-300 rounded mb-4"></div>
                      <div className="h-4 w-2/3 bg-gray-500 rounded mb-2"></div>
                      <div className="h-3 w-full bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 w-3/4 bg-gray-300 rounded mb-2"></div>
                    </div>
                    <div className="w-1/2 bg-gray-50 p-4">
                      {/* Version Comparison Header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="h-5 w-3/5 bg-blue-100 rounded border border-blue-200 flex items-center px-2">
                          <div className="h-2 w-full bg-blue-200 rounded"></div>
                        </div>
                        <div className="h-5 px-2 bg-blue-600 rounded text-white text-[8px] flex items-center">
                          VERSION 2
                        </div>
                      </div>

                      {/* Version Comparison Content */}
                      <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 w-5/6 bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 w-11/12 bg-gray-100 rounded mb-2"></div>

                      {/* Highlight the changes */}
                      <div className="h-4 w-2/3 bg-green-100 rounded mb-2 border-2 border-green-400 shadow-sm"></div>
                      <div className="h-4 w-4/5 bg-green-100 rounded mb-2 border-2 border-green-400 shadow-sm"></div>

                      <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 w-3/4 bg-gray-100 rounded mb-2"></div>

                      {/* Version control footer */}
                      <div className="flex justify-between mt-2">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                        <div className="h-5 w-16 bg-blue-500 rounded-md shadow-sm text-white text-[8px] flex items-center justify-center">
                          MERGE
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-gray-800 text-xl font-medium">
                  Document editors
                </p>
                <p className="text-gray-800 text-xl font-medium">
                  with versions
                </p>
              </div>
            </div>
            <div className="group cursor-pointer text-center">
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
                {/* Spreadsheet UI - Enhanced */}
                <div className="w-full h-64 lg:h-auto lg:aspect-[3/2] relative">
                  <div className="absolute inset-0 flex">
                    <div className="w-3/4 bg-white p-3">
                      {/* Spreadsheet Tab and Toolbar */}
                      <div className="flex mb-2">
                        <div className="h-6 px-3 bg-blue-500 rounded-t-md text-white text-[8px] font-medium flex items-center mr-1">
                          Budget 2025
                        </div>
                        <div className="h-6 px-3 bg-gray-200 rounded-t-md text-gray-600 text-[8px] font-medium flex items-center">
                          History
                        </div>
                        <div className="ml-auto flex space-x-1">
                          <div className="h-5 w-5 bg-blue-100 rounded flex items-center justify-center">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <div className="h-5 w-5 bg-gray-100 rounded flex items-center justify-center">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Spreadsheet Header Row */}
                      <div className="h-6 w-full bg-gray-100 rounded-t-sm mb-1 flex font-medium">
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center justify-center">
                          <div className="text-[8px] text-gray-600">A</div>
                        </div>
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center justify-center">
                          <div className="text-[8px] text-gray-600">B</div>
                        </div>
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center justify-center">
                          <div className="text-[8px] text-gray-600">C</div>
                        </div>
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center justify-center">
                          <div className="text-[8px] text-gray-600">D</div>
                        </div>
                        <div className="w-1/5 h-full flex items-center justify-center">
                          <div className="text-[8px] text-gray-600">E</div>
                        </div>
                      </div>

                      {/* Spreadsheet Data Rows */}
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="h-5 w-full bg-white rounded-sm mb-1 flex border-b border-gray-100"
                        >
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-2/3 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-3/4 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                        </div>
                      ))}

                      {/* Highlighted Row (Active Edit) */}
                      <div className="h-5 w-full bg-gray-100 rounded-sm mb-1 flex border-b border-gray-300 shadow-sm">
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center">
                          <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                        </div>
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center">
                          <div className="h-2 w-2/3 bg-gray-400 mx-1 rounded-sm"></div>
                        </div>
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center">
                          <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                        </div>
                        <div className="w-1/5 border-r border-gray-200 h-full flex items-center">
                          <div className="h-2 w-3/4 bg-gray-400 mx-1 rounded-sm"></div>
                        </div>
                        <div className="w-1/5 h-full flex items-center">
                          <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                        </div>
                      </div>

                      {/* Regular Rows */}
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-5 w-full bg-white rounded-sm mb-1 flex border-b border-gray-100"
                        >
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-2/3 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-3/4 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* History Panel */}
                    <div className="w-1/4 bg-gray-50 p-2 border-l border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[8px] font-semibold text-gray-600">
                          CELL HISTORY
                        </div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>

                      {/* History Timeline */}
                      <div className="relative mb-2">
                        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                        <div className="flex items-start mb-2 relative">
                          <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm z-10 mt-1 mr-2"></div>
                          <div className="flex-1">
                            <div className="text-[8px] font-medium mb-1 text-gray-700">
                              Current Value
                            </div>
                            <div className="h-4 w-full bg-white border border-gray-200 rounded-sm shadow-sm flex items-center px-1">
                              <div className="h-2 w-2/3 bg-green-100 rounded-sm"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start mb-2 relative">
                          <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm z-10 mt-1 mr-2"></div>
                          <div className="flex-1">
                            <div className="text-[8px] font-medium mb-1 text-gray-700">
                              Previous Edit
                            </div>
                            <div className="h-4 w-full bg-white border border-gray-200 rounded-sm flex items-center px-1">
                              <div className="h-2 w-1/2 bg-blue-100 rounded-sm"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start relative">
                          <div className="h-3 w-3 rounded-full bg-gray-400 shadow-sm z-10 mt-1 mr-2"></div>
                          <div className="flex-1">
                            <div className="text-[8px] font-medium mb-1 text-gray-700">
                              Original Value
                            </div>
                            <div className="h-4 w-full bg-white border border-gray-200 rounded-sm flex items-center px-1">
                              <div className="h-2 w-1/3 bg-gray-200 rounded-sm"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <div className="h-5 px-2 bg-blue-500 rounded-sm text-white text-[8px] flex items-center justify-center shadow-sm">
                          RESTORE
                        </div>
                        <div className="h-5 px-2 bg-gray-200 rounded-sm text-gray-600 text-[8px] flex items-center justify-center">
                          COMPARE
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-gray-800 text-xl font-medium">
                  Spreadsheets with
                </p>
                <p className="text-gray-800 text-xl font-medium">
                  complete history
                </p>
              </div>
            </div>
            <div className="group cursor-pointer text-center">
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
                {/* Agent UI */}
                <div className="w-full h-64 lg:h-auto lg:aspect-[3/2] relative">
                  <div className="absolute inset-0 flex">
                    <div className="w-3/4 bg-white p-3">
                      <div className="h-6 w-full bg-gray-100 rounded-sm mb-1 flex">
                        <div className="w-1/5 border-r border-gray-200 h-full"></div>
                        <div className="w-1/5 border-r border-gray-200 h-full"></div>
                        <div className="w-1/5 border-r border-gray-200 h-full"></div>
                        <div className="w-1/5 border-r border-gray-200 h-full"></div>
                        <div className="w-1/5 h-full"></div>
                      </div>
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-5 w-full bg-white rounded-sm mb-1 flex border-b border-gray-100"
                        >
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div
                              className={`h-2 ${
                                i === 2
                                  ? "w-2/3 bg-green-300"
                                  : "w-2/3 bg-gray-300"
                              } mx-1 rounded-sm`}
                            ></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div
                              className={`h-2 ${
                                i === 3
                                  ? "w-1/2 bg-blue-300"
                                  : "w-1/2 bg-gray-300"
                              } mx-1 rounded-sm`}
                            ></div>
                          </div>
                          <div className="w-1/5 border-r border-gray-100 h-full flex items-center">
                            <div className="h-2 w-3/4 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                          <div className="w-1/5 h-full flex items-center">
                            <div className="h-2 w-1/2 bg-gray-300 mx-1 rounded-sm"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="w-1/4 bg-gray-50 p-2 border-l border-gray-200">
                      <div className="h-4 w-5/6 bg-gray-300 rounded-sm mb-3"></div>
                      <div className="mb-3">
                        {/* Robot AI Agent Icon - Much more obvious */}
                        <div className="h-16 w-16 mx-auto relative">
                          {/* Robot Head */}
                          <div className="h-8 w-12 bg-gray-600 rounded-t-lg border-2 border-gray-700 absolute top-0 left-2 flex items-center justify-center shadow-md">
                            {/* Robot Eyes */}
                            <div className="flex space-x-3">
                              <div className="h-2.5 w-2.5 bg-white rounded-full flex items-center justify-center">
                                <div className="h-1.5 w-1.5 bg-gray-800 rounded-full"></div>
                              </div>
                              <div className="h-2.5 w-2.5 bg-white rounded-full flex items-center justify-center">
                                <div className="h-1.5 w-1.5 bg-gray-800 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                          {/* Robot Body */}
                          <div className="h-7 w-14 bg-gray-500 rounded-b-lg border-2 border-gray-600 absolute top-8 left-1 flex flex-col items-center justify-center shadow-md">
                            {/* Mouth/Display */}
                            <div className="h-1.5 w-8 bg-gray-300 rounded-sm mb-1 border border-gray-400"></div>
                            <div className="flex space-x-1">
                              <div className="h-1 w-1 bg-red-500 rounded-full"></div>
                              <div className="h-1 w-1 bg-yellow-500 rounded-full"></div>
                              <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                            </div>
                          </div>
                          {/* Robot Antenna */}
                          <div className="h-3 w-1 bg-gray-600 absolute top-[-3px] left-8">
                            <div className="h-2 w-2 bg-red-500 rounded-full absolute top-[-1px] left-[-0.5px]"></div>
                          </div>
                          {/* Robot Arms */}
                          <div className="h-1.5 w-4 bg-gray-400 absolute top-10 left-[-2px] rounded-full border border-gray-500"></div>
                          <div className="h-1.5 w-4 bg-gray-400 absolute top-10 right-[-2px] rounded-full border border-gray-500"></div>
                        </div>
                        <div className="flex justify-center mt-1">
                          <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                            AI AGENT
                          </div>
                        </div>
                      </div>
                      <div className="h-16 bg-white rounded-lg border border-gray-200 p-2 mb-2 shadow-sm">
                        <div className="flex items-center mb-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-1.5"></div>
                          <div className="h-2 w-2/3 bg-gray-200 rounded-sm"></div>
                        </div>
                        <div className="h-3 w-full bg-green-100 rounded-sm mb-1.5 border border-green-200 flex items-center px-1">
                          <div className="h-1.5 w-1/4 bg-green-300 rounded-sm"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-2 w-1/2 bg-gray-200 rounded-sm"></div>
                          <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 w-1/2 bg-green-500 rounded-sm text-white text-[8px] flex items-center justify-center shadow-sm">
                          Processing
                        </div>
                        <div className="h-3 w-6 bg-gray-200 rounded-sm flex items-center justify-center shadow-sm">
                          <div className="flex space-x-0.5">
                            <div className="h-1.5 w-1 bg-gray-400 rounded-sm"></div>
                            <div className="h-1.5 w-1 bg-gray-400 rounded-sm"></div>
                            <div className="h-1.5 w-1 bg-gray-400 rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-gray-800 text-xl font-medium">
                  Agents that perform
                </p>
                <p className="text-gray-800 text-xl font-medium">async work</p>
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
                    href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/index.ts"
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
                    href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/get-diff.ts"
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
                    href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-proposal/create-change-proposal.ts"
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
              <span>Every "Cursor for X" needs</span>{" "}
              <LixLogo className="ml-2 w-10 h-8 transform translate-y-[-2px]" />
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8 text-lg">
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
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium text-sm text-gray-800">AI Changes</span>
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
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium text-sm text-gray-800">Human Review</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded px-3 py-1.5 text-xs font-medium flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </button>
                    <button className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded px-3 py-1.5 text-xs font-medium flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[100rem] mx-auto px-4">
              {/* Card 1: Parallel AI Exploration - STEP 1 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all h-full flex flex-col">
                <div className="p-7">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-800">
                      Parallel AI Exploration
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Initialize parallel versions for different AI agents to explore solutions independently.
                  </p>
                </div>
                <div className="mt-auto p-7 bg-gray-50 border-t border-gray-100">
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <div className="text-gray-400 mb-2">// Create separate versions for different AI approaches</div>
                    <div className="text-white mb-1">
                      <span className="text-blue-400">const</span> creativeVersion = <span className="text-purple-400">await</span> lix.createVersion(<span className="text-green-400">"creative-ai"</span>);
                    </div>
                    <div className="text-white mb-3">
                      <span className="text-blue-400">const</span> preciseVersion = <span className="text-purple-400">await</span> lix.createVersion(<span className="text-green-400">"precise-ai"</span>);
                    </div>
                    <div className="text-gray-400 mb-2">// AI agents work in parallel on their versions</div>
                    <div className="text-white mb-1">
                      <span className="text-purple-400">await</span> Promise.all([
                    </div>
                    <div className="text-white ml-4 mb-1">runCreativeAI(creativeVersion),</div>
                    <div className="text-white ml-4 mb-1">runPreciseAI(preciseVersion)</div>
                    <div className="text-white">]);</div>
                  </div>
                </div>
              </div>

              {/* Card 2: AI Proposals - STEP 2 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all h-full flex flex-col">
                <div className="p-7">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-800">
                      AI Change Proposals
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed">
                    AI creates formal change proposals from exploration results that humans can review.
                  </p>
                </div>
                <div className="mt-auto p-7 bg-gray-50 border-t border-gray-100">
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <div className="text-gray-400 mb-2">// Compare the different AI approaches</div>
                    <div className="text-white mb-3">
                      <span className="text-blue-400">const</span> diff = <span className="text-purple-400">await</span> lix.getDiff(creativeVersion, preciseVersion);
                    </div>
                    <div className="text-gray-400 mb-2">// AI creates a proposal with the best changes</div>
                    <div className="text-white mb-1">
                      <span className="text-blue-400">const</span> proposal = <span className="text-purple-400">await</span> lix.createProposal({`{`}
                    </div>
                    <div className="text-white ml-4 mb-1">changes: selectBestChanges(diff),</div>
                    <div className="text-white ml-4 mb-1">
                      title: <span className="text-green-400">"AI-suggested improvements"</span>,
                    </div>
                    <div className="text-white ml-4 mb-1">
                      description: <span className="text-green-400">"Combined creative + precise approach"</span>
                    </div>
                    <div className="text-white">{`}`});</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Human Review & Attribution - STEP 3 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all h-full flex flex-col">
                <div className="p-7">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-800">
                      Human Review & Attribution
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Humans review proposals with full change attribution before applying them to production.
                  </p>
                </div>
                <div className="mt-auto p-7 bg-gray-50 border-t border-gray-100">
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <div className="text-gray-400 mb-2">// Human reviews and labels the changes</div>
                    <div className="text-white mb-1">
                      <span className="text-purple-400">await</span> lix.addLabel({`{`}
                    </div>
                    <div className="text-white ml-4 mb-1">changeId: proposal.id,</div>
                    <div className="text-white ml-4 mb-1">
                      label: <span className="text-green-400">"reviewed-by:human"</span>
                    </div>
                    <div className="text-white mb-3">{`}`});</div>
                    <div className="text-gray-400 mb-2">// Apply changes when approved</div>
                    <div className="text-white mb-1">
                      <span className="text-blue-400">const</span> approved = <span className="text-purple-400">await</span> humanReview(proposal);
                    </div>
                    <div className="text-white mb-1">
                      <span className="text-blue-400">if</span> (approved) {`{`}
                    </div>
                    <div className="text-white ml-4 mb-1">
                      <span className="text-purple-400">await</span> lix.applyProposal(proposal.id);
                    </div>
                    <div className="text-white">{`}`}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="https://github.com/opral/monorepo/tree/main/packages/lix-docs/docs/guide/concepts/change-proposals.md"
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
              href="https://github.com/opral/monorepo/tree/main/packages/lix-sdk/src"
              target="_blank"
              rel="noopener noreferrer"
              className="h-44 bg-blue-600 text-white rounded-lg p-6 font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg border border-blue-700 flex flex-col justify-between group"
            >
              <span className="text-xl font-semibold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Go to Docs
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

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-5 py-16 text-center border-t border-gray-100 mt-10">
        <div className="mb-8">
          <a
            href="https://opral.com"
            className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
          >
            opral.com
          </a>
        </div>
        <p className="text-gray-400 text-sm">
          ©Opral (c) 2025 • The Change Control Company
        </p>
      </footer>
    </div>
  );
}

export default App;
