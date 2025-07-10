import React, { useState, useEffect } from "react";
import { 
  SandpackProvider, 
  SandpackCodeEditor, 
  SandpackConsole,
  SandpackPreview
} from "@codesandbox/sandpack-react";

const LixSandpack = ({
  feature,
  example,
  height = "800px",
  showConsole = true,
  fullWidth = false,
}) => {
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const customSetup = {};

  const options = {
    autorun: true,
    showConsole: true,
    layout: "console",
  };

  const loadSdkBundle = async () => {
    try {
      console.log("📦 Loading Lix SDK bundle...");
      const response = await fetch("/lix-sdk-bundle.js");
      if (response.ok) {
        const bundleContent = await response.text();
        console.log("✅ SDK bundle loaded successfully");
        return bundleContent;
      } else {
        throw new Error(`Failed to load SDK bundle: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Failed to load SDK bundle:", error);
      throw error;
    }
  };

  const loadExampleFiles = async () => {
    try {
      setLoading(true);

      // Load SDK bundle first
      const sdkBundle = await loadSdkBundle();

      // Load examples mapping
      const mappingResponse = await fetch("/examples-mapping.json");
      if (!mappingResponse.ok) {
        throw new Error("Failed to load examples mapping");
      }
      const examplesMapping = await mappingResponse.json();

      const featureConfig = examplesMapping[feature];
      if (!featureConfig) {
        throw new Error(`Feature ${feature} not found in examples mapping`);
      }

      const exampleConfig = featureConfig.examples.find(
        (ex) => ex.name === example
      );
      if (!exampleConfig) {
        throw new Error(`Example ${example} not found in feature ${feature}`);
      }

      const filesMap = {};
      for (const [filePath, sourceFile] of Object.entries(
        exampleConfig.files
      )) {
        try {
          const response = await fetch(`/examples/${sourceFile}`);
          if (!response.ok) {
            throw new Error(`Failed to load ${sourceFile}`);
          }
          let content = await response.text();

          // Keep the original import syntax - SandPack will handle it with fake node_modules
          filesMap[filePath] = {
            code: content,
          };
        } catch (fileError) {
          console.error(`Error loading file ${sourceFile}:`, fileError);
          filesMap[filePath] = {
            code: `// Error loading example: ${sourceFile}`,
          };
        }
      }

      // Add the SDK bundle using the proper fake node_modules approach
      filesMap["/node_modules/@lix-js/sdk/package.json"] = {
        hidden: true,
        code: JSON.stringify({
          name: "@lix-js/sdk",
          main: "./index.js",
        }),
      };

      filesMap["/node_modules/@lix-js/sdk/index.js"] = {
        hidden: true,
        code: sdkBundle,
      };

      console.log("📋 Final files map:", Object.keys(filesMap));
      console.log("📝 Files structure:", filesMap);
      setFiles(filesMap);
      setError(null);
    } catch (err) {
      console.error("Error loading examples:", err);
      setError(err.message);
      setFiles({
        "/index.js": {
          code: `// Error loading example: ${feature}/${example}\n// ${err.message}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExampleFiles();
  }, [feature, example]);

  if (loading) {
    return (
      <div
        className="lix-sandpack-loading"
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading example...</div>
      </div>
    );
  }

  return (
    <div
      className={`lix-sandpack ${fullWidth ? "full-width" : ""}`}
      style={{
        margin: "1rem 0",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <SandpackProvider
        template="vanilla"
        files={files}
        customSetup={customSetup}
        options={options}
        theme="light"
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <SandpackCodeEditor showLineNumbers />
          <SandpackConsole 
            showHeader={true}
            standalone={false}
          />
          {/* Hidden preview to make console work */}
          <SandpackPreview style={{ display: "none" }} />
        </div>
      </SandpackProvider>
    </div>
  );
};

export default LixSandpack;
