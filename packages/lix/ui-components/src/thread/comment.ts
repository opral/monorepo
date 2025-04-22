import type { ThreadComment } from "@lix-js/sdk";
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

export type LixUiThreadCommentProps = {
  comment: ThreadComment;
};

@customElement("lix-ui-thread-comment")
export class LixUiThreadComment extends LitElement {
  @property()
  accessor comment: ThreadComment = {} as ThreadComment;

  static styles = css`
    :host {
      display: block;
      border: 1px solid #e0e0e0; /* Light gray border */
      padding: 8px;
      margin-bottom: 8px;
      background-color: white;
      font-family: sans-serif;
      font-size: 14px;
    }
    .content {
      /* Style for the content area if needed */
      margin-top: 4px;
    }
    /* Add styles for author, timestamp later */
  `;

  render() {
    // Add checks for comment existence if necessary
    if (!this.comment?.id) {
      return html`<div>Loading comment...</div>`; // Or render nothing
    }

    return html`
      <div class="comment-container">
        <!-- Author and timestamp placeholders -->
        <!-- <div><strong>Author Name</strong> - Timestamp</div> -->
        <div class="content">${this.comment.content}</div>
      </div>
    `;
  }
}
