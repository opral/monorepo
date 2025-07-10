import React, { useState } from "react";
import { type TestCase, testCasesBySection } from "../../src/test-cases";
import { Showcase } from "./showcase";
// @ts-expect-error - raw import
import defaultCss from "../../src/default.css?raw";

export function TestCases() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filterCases = (cases: TestCase[]) => {
    if (searchTerm.trim() === "") {
      return cases;
    }
    return cases.filter((tc) =>
      tc.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  return (
    <div>
      <input
        type="search"
        placeholder="Filter test cases by name..."
        value={searchTerm}
        onChange={handleSearchInput}
        className="w-full p-2 mb-8 border border-gray-300 rounded"
      />

      {Object.keys(testCasesBySection).map((sectionKey, index) => (
        <section
          key={sectionKey}
          id={sectionKey}
          className={`mb-12 ${index === 0 ? "mt-4" : ""}`}
        >
          <h2 className="text-2xl font-bold mb-6">{sectionKey}</h2>
          <div className="test-cases">
            {filterCases(
              testCasesBySection[sectionKey as keyof typeof testCasesBySection],
            ).map((tc) => (
              <React.Fragment key={tc.name}>
                <TestCaseCard testCase={tc} />
                <hr className="my-6 border-gray-200" />
              </React.Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TestCaseCard(props: { testCase: TestCase }) {
  // State for editable HTML content
  const [beforeHtml, setBeforeHtml] = useState(props.testCase.beforeHtml);
  const [afterHtml, setAfterHtml] = useState(props.testCase.afterHtml);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{props.testCase.name}</h3>

      <Showcase
        before={beforeHtml}
        after={afterHtml}
        editable={true}
        css={defaultCss}
        onBeforeChange={setBeforeHtml}
        onAfterChange={setAfterHtml}
      />
    </div>
  );
}
