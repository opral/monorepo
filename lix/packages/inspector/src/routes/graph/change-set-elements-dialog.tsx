import { useQuery } from "@/hooks/use-query";
import { useLix } from "@/hooks/use-lix";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Change } from "@lix-js/sdk";

export function ChangeSetElementsDialog(props: {
  changeSetId: string;
  onClose: () => void;
}) {
  const lix = useLix();

  const [changes] = useQuery(
    () =>
      lix.db
        .selectFrom("change")
        .innerJoin(
          "change_set_element",
          "change_set_element.change_set_id",
          "change.id"
        )
        .innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
        .where("change_set_element.change_set_id", "=", props.changeSetId)
        .selectAll("change")
        .select("snapshot.content")
        .execute(),
    [props.changeSetId]
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View elements
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change set elements</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {changes?.map((change) => <Change key={change.id} change={change} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Change(props: { change: Change & { content: any } }) {
  return <div>{props.change.id}</div>;
}
