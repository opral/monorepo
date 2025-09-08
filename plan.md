# Simplified Agent Thread Integration Plan

Goal
- Replace conversation storage in KV with a single Lix thread used as the default agent conversation.
- Keep a lightweight pointer to that thread in `key_value_all` under key `lix_agent_thread_id`.
- Encode role per message in `thread_comment.metadata.lix_agent_role` (not in the body).

Overview
- Transcript source of truth: `thread` + `thread_comment` (global version).
- Pointer: `key_value_all[key='lix_agent_thread_id', lixcol_version_id='global']` stores the active thread id.
- Messages become `thread_comment` rows. Role is stored in `metadata.lix_agent_role`.

Data model
- `thread` (global): one row for the agent conversation.
- `thread_comment` (global): each message (user or assistant) as a comment.
- Role tagging: `metadata: { lix_agent_role: 'user' | 'assistant' }`. Body uses ZettelDoc plain text.

Bootstrapping (on agent init)
1) Try to read `key_value_all` (global) for key `lix_agent_thread_id`.
2) If found: set `thread_id = value`.
3) If not found: create a new thread in global (`createThread({ lix, versionId: 'global' })`), then insert the pointer in `key_value_all`.

Write path (sendMessage)
1) Append user message: `createThreadComment({ lix, thread_id, body: fromPlainText(text), metadata: { lix_agent_role: 'user' } })`.
2) After LLM reply, append assistant message: `createThreadComment({ lix, thread_id, body: fromPlainText(reply), metadata: { lix_agent_role: 'assistant' } })`.
3) No more KV writes for messages.

Read path (UI subscription)
- Subscribe to: `SELECT id, body, metadata, lixcol_created_at FROM thread_comment WHERE thread_id = ? ORDER BY lixcol_created_at ASC, id ASC`.
- Map each row to `{ id, role, content }` where `role = metadata.lix_agent_role ?? 'assistant'` and `content = toPlainText(body)`.

Clear behavior
- Create a fresh thread in global; update `lix_agent_thread_id` to the new id; UI re-subscribes and shows an empty transcript.
- (We preserve history in the old thread; no deletions.)

Implementation steps
1) Replace KV usage in `@lix-js/agent` with thread pointer + thread_comment writes (with `metadata.lix_agent_role`).
2) Add a helper to read/create the default thread id and get/set the pointer.
3) Update `sendMessage` to write user/assistant as thread comments (remove KV persists).
4) In Flashtype hook, subscribe to thread_comment by `thread_id` and map rows using `metadata.lix_agent_role`.
5) Implement `clear` as: new thread + update pointer + resubscribe.
6) Add tests: metadata presence on write; role mapping; clear behavior; pointer boot logic.

Notes
- All thread/comment rows live in the global version for simplicity and portability across versions.
- Ordering uses `lixcol_created_at` then `id` for determinism.
- This keeps UX stable today, and later allows multi-conversation by introducing a small selector and storing multiple ids.
