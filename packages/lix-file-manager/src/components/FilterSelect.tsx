import { useAtom } from "jotai/react";
import IconAdd from "./icons/IconAdd.tsx";
// import IconFilter from "./icons/IconFilter.tsx";
import { Button } from "./ui/button.tsx";
import { selectedChangeIdsAtom } from "@/state-active-file.ts";
import { Checkbox } from "./ui/checkbox.tsx";
import { lixAtom } from "@/state.ts";
import { createThread } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.tsx";
import { FormField, FormControl, FormItem, Form } from "./ui/form.tsx";
import { FormProvider, useForm } from "react-hook-form";
import { Textarea } from "./ui/textarea.tsx";
import { useState } from "react";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import IconArrow from "./icons/IconArrow.tsx";

const FilterSelect = () => {
  const [selectedChangeIds, setSelectedChangeIds] = useAtom(selectedChangeIdsAtom);
  const [lix] = useAtom(lixAtom);
  // TODO: replace with actual changes if this component is used again
  const [changesActiveVersion] = useState<{ id: string }[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      discussion: "",
    },
  });
  const { handleSubmit, watch, formState: { isValid } } = form;
  const discussionValue = watch("discussion");

  const handleSelectAll = () => {
    // select or unset all changes
    if (selectedChangeIds.length === 0 && changesActiveVersion.length > 0) {
      setSelectedChangeIds(changesActiveVersion.map((change) => change.id));
    } else {
      setSelectedChangeIds([]);
    }
  };

  const handleAddDiscussion = async () => {
    const resolve = await lix.db.transaction().execute(
      async (trx) => {
        return await createThread({
					lix: { ...lix, db: trx },
          comments: [{ body: fromPlainText(discussionValue) }],
				});
      }
    );
    await saveLixToOpfs({ lix });
    setIsPopoverOpen(false);
    form.reset();
    setSelectedChangeIds([]);
    console.log(resolve);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit(handleAddDiscussion)();
    }
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  return (
    <FormProvider {...form}>
      <div className="pl-3 pr-2 py-1.5 w-full h-12 flex items-center gap-3 text-slate-500">
        <Checkbox
          onClick={handleSelectAll}
          checked={changesActiveVersion.length === selectedChangeIds.length}
          minus={selectedChangeIds.length > 0 && changesActiveVersion.length !== selectedChangeIds.length}
        />
        {selectedChangeIds.length > 0 && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <div>
                <Button variant="secondary">
                  <IconAdd />
                  Discussion
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-2">
              <Form {...form}>
                <form
                  onSubmit={handleSubmit(handleAddDiscussion)}
                  className="flex items-center gap-2"
                >
                  <FormField
                    control={form.control}
                    name="discussion"
                    rules={{ required: "Discussion content is required" }}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={1}
                            placeholder="Add a comment"
                            className="border-none resize-none overflow-hidden shadow-none p-1 focus-visible:ring-0"
                            onInput={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            style={{ minHeight: "24px", fontSize: "1rem" }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={!isValid || discussionValue === ""}
                    size="sm"
                    variant="ghost"
                    className="px-1 ml-auto mt-auto"
                  >
                    <IconArrow />
                  </Button>
                </form>
              </Form>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </FormProvider>
  );
};

export default FilterSelect;