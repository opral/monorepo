import { testCases } from "../src/test-cases.js";
import { renderUniversalDiff } from "../src/render-universal-diff.js";

const container = document.getElementById("test-case-container");

if (!container) {
  console.error("Test case container not found!");
} else {
  testCases.forEach((testCase) => {
    const caseWrapper = document.createElement("div");
    caseWrapper.className = "test-case";

    const nameHeader = document.createElement("h2");
    nameHeader.textContent = testCase.name;
    caseWrapper.appendChild(nameHeader);

    // Before HTML
    const beforeLabel = document.createElement("span");
    beforeLabel.className = "label";
    beforeLabel.textContent = "Before:";
    caseWrapper.appendChild(beforeLabel);
    const beforePre = document.createElement("pre");
    beforePre.textContent = testCase.beforeHtml;
    caseWrapper.appendChild(beforePre);

    // After HTML
    const afterLabel = document.createElement("span");
    afterLabel.className = "label";
    afterLabel.textContent = "After:";
    caseWrapper.appendChild(afterLabel);
    const afterPre = document.createElement("pre");
    afterPre.textContent = testCase.afterHtml;
    caseWrapper.appendChild(afterPre);

    // Rendered Diff
    const diffLabel = document.createElement("span");
    diffLabel.className = "label";
    diffLabel.textContent = "Rendered Diff:";
    caseWrapper.appendChild(diffLabel);

    const diffOutputWrapper = document.createElement("div");
    diffOutputWrapper.className = "diff-output";
    try {
      const diffElement = renderUniversalDiff({
        beforeHtml: testCase.beforeHtml,
        afterHtml: testCase.afterHtml,
      });
      diffOutputWrapper.appendChild(diffElement);
    } catch (error) {
        console.error(`Error rendering diff for test case: "${testCase.name}"`, error);
        diffOutputWrapper.textContent = "Error rendering diff. See console.";
        diffOutputWrapper.style.color = "red";
    }
    caseWrapper.appendChild(diffOutputWrapper);

    container.appendChild(caseWrapper);
  });
}
