import { useLix } from "../../hooks/use-lix";
import { useQuery } from "../../hooks/use-query";
import type { Change } from "@lix-js/sdk";
import { useState } from "react";

interface ChangeSetElementsDialogProps {
  changeSetId: string;
  onClose: () => void;
}

export function ChangeSetElementsDialog(props: ChangeSetElementsDialogProps) {
  const lix = useLix();
  const [isOpen, setIsOpen] = useState(false);

  const [changes] = useQuery(async () => {
    const result = await lix.db
      .selectFrom("change")
      .innerJoin(
        "change_set_element",
        "change_set_element.change_id",
        "change.id"
      )
      .innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
      .where("change_set_element.change_set_id", "=", props.changeSetId)
      .selectAll("change")
      .select("snapshot.content")
      .execute();
    return result;
  }, [props.changeSetId, lix]);

  return (
    <>
      <button
        className="mt-2 w-full py-1 px-2 text-xs bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        View Changes ({changes?.length || 0})
      </button>

      {/* DaisyUI Modal */}
      <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-3xl max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-lg mb-2">
            Changes for {props.changeSetId.substring(0, 8)}
          </h3>
          <div className="grid gap-4 py-4">
            {changes?.map((change) => <Change key={change.id} change={change} />)}
          </div>
          <div className="modal-action">
            <button className="btn" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsOpen(false)}>close</button>
        </form>
      </dialog>
    </>
  );
}

function Change(props: { change: Change & { content: any } }) {
  // Format the JSON content
  const formattedContent = JSON.stringify(props.change.content, null, 2);

  return (
    <div className="border border-gray-200 p-3">
      <div className="font-medium border-b pb-2 mb-2">
        Change {props.change.id.substring(0, 8)}
      </div>

      <div className="space-y-1 mb-3 text-sm">
        <div>
          <div className="font-medium text-gray-500">File ID</div>
          <div className="font-mono">{props.change.file_id}</div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Schema Key</div>
          <div className="font-mono">{props.change.schema_key}</div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Entity ID</div>
          <div className="font-mono">{props.change.entity_id}</div>
        </div>
      </div>

      <div>
        <div className="font-medium text-gray-500 mb-1">Snapshot</div>
        <div
          className="bg-gray-50 p-2 font-mono text-xs overflow-auto"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {formattedContent}
        </div>
      </div>
    </div>
  );
}
