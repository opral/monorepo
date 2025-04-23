import { fromPlainText, toPlainText, ZettelDoc } from "@lix-js/sdk/zettel-ast";
import React, { useState } from "react";

export interface ThreadComposerProps {
  threadId?: string;
  commentId?: string;
  initialContent?: ZettelDoc;
  onSubmit?: (payload: {
    value: ZettelDoc;
    threadId?: string;
    commentId?: string;
  }) => void;
}

/**
 * A minimal thread composer React component.
 *
 * Replace the textarea with your rich text editor as needed.
 */
export function ThreadComposer({
  threadId,
  commentId,
  initialContent = fromPlainText(""),
  onSubmit,
}: ThreadComposerProps) {
  const [value, setValue] = useState(initialContent);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(fromPlainText(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || (typeof value === "string" && !value)) return;
    onSubmit?.({ value, threadId, commentId });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ border: "1px solid #ccc", padding: 8 }}
    >
      <textarea
        value={toPlainText(value)}
        onChange={handleChange}
        placeholder="Write a comment..."
        style={{ width: "100%", minHeight: 80, marginBottom: 8 }}
      />
      <button
        type="submit"
        disabled={!value || (typeof value === "string" && !value)}
      >
        {threadId ? "Reply" : "Comment"}
      </button>
    </form>
  );
}
