import { useEffect, useState } from "react"
import { vscode } from "./utils/vscode"
import Editor from "./components/Editor"
import { BundleNested, ProjectSettings } from "@inlang/sdk"

type VscodeMessage = {
  command: "update",
  payload: {
    bundle: BundleNested,
    settings: ProjectSettings
  }
}

function App() {
  const [bundle, setBundle] = useState<BundleNested | undefined>(undefined)
  const [settings, setSettings] = useState<ProjectSettings | undefined>(undefined)

  useEffect(() => {
    // Listen for messages from the extension
    vscode.onMessage((message: unknown) => {
      const typedMessage = message as VscodeMessage; // Type assertion

      setBundle(typedMessage.payload.bundle)
      setSettings(typedMessage.payload.settings)
    });
  }, [])

  return (
    <div>
      {bundle && settings ? (
        <Editor
          bundle={bundle}
          settings={settings}
          setShowHistory={(variantId) => console.log("Show history", variantId)}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

export default App
