import { openLix } from "@lix-js/sdk";

async function demonstrateJSONFileDiffing() {
  const lix = await openLix({});

  // 1. Get the last two versions of a JSON file from history
  const fileHistory = await lix.db
    .selectFrom("file_history")
    .where("id", "=", "json-file-id")
    .orderBy("lixcol_created_at", "desc")
    .limit(2)
    .execute();

  if (fileHistory.length < 2) {
    console.log("Need at least 2 versions of the file to compare");
    return;
  }

  const afterState = JSON.parse(fileHistory[0].data);
  const beforeState = JSON.parse(fileHistory[1].data);

  console.log("Before state:", beforeState);
  console.log("After state:", afterState);

  // 2. Compare the two states to generate a diff.
  //
  // This is a simplified example. In a real app,
  // you would likely use a diffing library.
  const diffOutput = [];
  if (beforeState.name !== afterState.name) {
    diffOutput.push(`- name: ${beforeState.name}`);
    diffOutput.push(`+ name: ${afterState.name}`);
  }
  if (beforeState.version !== afterState.version) {
    diffOutput.push(`- version: ${beforeState.version}`);
    diffOutput.push(`+ version: ${afterState.version}`);
  }

  // 3. The diff can then be displayed in your application.
  console.log("Diff output:");
  console.log(diffOutput.join("\n"));
  
  // Expected output:
  // - name: My Project
  // + name: My Awesome Project
  // - version: 1.0.0
  // + version: 1.1.0
}

// Run the demonstration
demonstrateJSONFileDiffing().catch(console.error);