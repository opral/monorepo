import { useState, useContext } from "react";
import type { Change } from "@lix-js/sdk";
import { FloatingWindow } from "../../components/floating-window";
import { createPortal } from "react-dom";
import { Context } from "../../context";
import { useQuery } from "@lix-js/react-utils";
import { Copy } from "lucide-react";

interface ChangeSetElementsWindowProps {
  changeSetId: string;
  onClose?: () => void;
}

export function ChangeSetElementsWindow(props: ChangeSetElementsWindowProps) {
  const { rootContainer } = useContext(Context);
  const [isOpen, setIsOpen] = useState(false);

  const changes = useQuery((lix) =>
    lix.db
      .selectFrom("change")
      .innerJoin(
        "change_set_element",
        "change_set_element.change_id",
        "change.id"
      )
      .where("change_set_element.change_set_id", "=", props.changeSetId)
      .selectAll("change")
  );

  const handleClose = () => {
    setIsOpen(false);
    if (props.onClose) props.onClose();
  };

  return (
    <>
      <button
        className="btn btn-sm btn-outline"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        View Changes ({changes?.length || 0})
      </button>

      {isOpen && (
        <FloatingWindowPortal
          rootContainer={rootContainer}
          title={`Change set ${props.changeSetId}`}
          onClose={handleClose}
        >
          <div className="grid gap-4 p-4 max-w-full overflow-hidden">
            {!changes ? (
              <div className="text-center p-4">Loading changes...</div>
            ) : changes.length === 0 ? (
              <div className="text-center p-4">No changes found</div>
            ) : (
              changes.map((change) => (
                <ChangeComponent key={change.id} change={change} />
              ))
            )}
          </div>
        </FloatingWindowPortal>
      )}
    </>
  );
}

// Helper component to handle the portal logic
function FloatingWindowPortal({
  rootContainer,
  children,
  title,
  onClose,
}: {
  rootContainer: HTMLElement | null;
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  // Create the window content with default position and size
  // The FloatingWindow component will handle position and size state internally
  const windowContent = (
    <FloatingWindow
      title={title}
      isOpen={true}
      onClose={onClose}
      initialPosition={{ x: 100, y: 100 }}
      initialSize={{ width: 600, height: 500 }}
    >
      {children}
    </FloatingWindow>
  );

  // Get the shadow root from the container
  const portalTarget = rootContainer?.shadowRoot;

  // Create the portal
  return createPortal(windowContent, portalTarget!);
}

function ChangeComponent(props: { change: Change }) {
  // Format the JSON content
  const formattedContent = JSON.stringify(
    props.change.snapshot_content,
    null,
    2
  );

  const handleCopy = () => {
    const changeText = `ID: ${props.change.id}
File ID: ${props.change.file_id}
Schema Key: ${props.change.schema_key}
Entity ID: ${props.change.entity_id}
Snapshot:
${formattedContent}`;

    navigator.clipboard.writeText(changeText);
  };

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden w-full">
      <div className="card-body p-4 overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div></div>
          <div className="tooltip tooltip-bottom" data-tip="Copy">
            <button onClick={handleCopy} className="btn btn-xs btn-ghost">
              <Copy size={16} />
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          <div>
            <strong>ID:</strong>{" "}
            <span className="font-mono">{props.change.id}</span>
          </div>
          <div>
            <strong>File ID:</strong> {props.change.file_id}
          </div>
          <div>
            <strong>Schema Key:</strong> {props.change.schema_key}
          </div>
          <div>
            <strong>Entity ID:</strong> {props.change.entity_id}
          </div>
          <div>
            <strong>Snapshot:</strong>
            <pre className="bg-base-200 p-2 rounded mt-1 overflow-auto text-sm w-full whitespace-pre-wrap break-all">
              {formattedContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
