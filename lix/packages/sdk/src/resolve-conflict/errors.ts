export class ResolveConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ResolveConflictError";
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

export class ChangeHasBeenMutatedError extends ResolveConflictError {
	constructor() {
		super(
			"The to be resolved change already exists in the database and is not equal to the provided change. Changes are immutable. If you want to resolve a conflict by updating a change, create a new change.",
		);
		this.name = "ChangeHasBeenMutatedError";
	}
}
