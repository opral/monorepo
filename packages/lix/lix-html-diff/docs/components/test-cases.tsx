import React, { useEffect, useState } from "react";
import { type TestCase, testCases } from "../../src/test-cases";
import { renderHtmlDiff } from "../../src/render-html-diff";
import { TabbedContentViewer } from "./tabbed-content-viewer";

export function TestCases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCases, setFilteredCases] = useState(testCases);

  useEffect(() => {
    setFilteredCases(filterTestCases(searchTerm));
  }, [searchTerm]);

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <input
        type="search"
        placeholder="Filter test cases by name..."
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

function TestCaseCard(props: { testCase: TestCase }) {
  // State for editable HTML content
  const [beforeHtml, setBeforeHtml] = useState(props.testCase.beforeHtml);
  const [afterHtml, setAfterHtml] = useState(props.testCase.afterHtml);

  // Generate diff based on current state
  const diff = renderHtmlDiff({
    beforeHtml,
    afterHtml,
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{props.testCase.name}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <TabbedContentViewer
            title="Before"
            htmlContent={beforeHtml}
            onContentChange={setBeforeHtml}
            editable={true}
            showTitle={true}
            defaultTab="rendered"
          />
        </div>
        <div className="flex-1 min-w-0">
          <TabbedContentViewer
            title="After"
            htmlContent={afterHtml}
            onContentChange={setAfterHtml}
            editable={true}
            showTitle={true}
            defaultTab="rendered"
          />
        </div>
      </div>

      <TabbedContentViewer
        title="Rendered Diff"
        htmlContent={diff}
        showTitle={true}
        defaultTab="rendered"
      />
    </div>
  );
}

function filterTestCases(searchTerm: string): TestCase[] {
  if (searchTerm.trim() === "") {
    return testCases;
  }

  return testCases.filter((tc) =>
    tc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
}
