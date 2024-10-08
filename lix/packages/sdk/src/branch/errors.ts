import dedent from "dedent";

export class BranchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BranchError";
	}
}

export class BranchExistsError extends BranchError {
	constructor(args: { name: string; id: string }) {
		super(dedent`
The branch with name "${args.name}" already exists with id "${args.id}".

`);
		this.name = "BranchAlreadyExistsError";
	}
}

export class PluginMissingError extends BranchError {
	constructor(args: { type: string; handler: string }) {
		super(dedent`
Plugin is missing the "${args.handler}" for type: "${args.type}".

`);
		this.name = "PluginMissingError";
	}
}
