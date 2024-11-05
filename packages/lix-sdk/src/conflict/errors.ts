import type { Change, Conflict } from "../database/schema.js";
import dedent from "dedent";

export class ResolveConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ResolveConflictError";
	}
}

export class ChangeAlreadyExistsError extends ResolveConflictError {
	constructor(args: { id: Change["id"] }) {
		super(dedent`
The change with id "${args.id}" already exists.

Changes are immutable. If you want to resolve a conflict by updating a change, create a new change.
`);
		this.name = "ChangeAlreadyExistsError";
	}
}

export class SelectedChangeNotInConflictError extends ResolveConflictError {
	constructor(args: { selectedChangeId: string; conflict: Conflict }) {
		super(
			dedent`
The selected change with id "${args.selectedChangeId}" is not part of the conflict.

You must choose one of the two changes in the conflict:

- change_id: "${args.conflict.change_id}"
- conflicting_change_id: "${args.conflict.conflicting_change_id}"
`,
		);
		this.name = "SelectedChangeNotInConflictError";
	}
}

export class ChangeDoesNotBelongToFileError extends ResolveConflictError {
	constructor() {
		super(
			"The to be resolved change does not belong to the same file as the conflicting changes.",
		);
		this.name = "ChangeDoesNotBelongToFileError";
	}
}

export class ChangeNotDirectChildOfConflictError extends ResolveConflictError {
	constructor() {
		super(
			"The to be resolved change is not a direct child of the conflicting changes. The parent_id of the resolveWithChange must be the id of the conflict or the conflicting change.",
		);
		this.name = "ChangeNotDirectChildOfConflictError";
	}
}
