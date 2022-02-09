/**
 * Types are not exported by cleye.
 * This file corresponds to cleye 1.1.0
 */

import type { TypeFlag, Flags as BaseFlags } from 'type-flag';

export type Command<Options extends CommandOptions = CommandOptions, ParsedType = any> = {
    readonly options: Options;
    readonly callback?: CallbackFunction<any>;
    [parsedType]: ParsedType;
};

export type CommandOptions<Parameters = string[]> = {
    /**
	Name of the command used to invoke it. Also displayed in `--help` output.
	*/
    name: string;

    /**
	Aliases for the command used to invoke it. Also displayed in `--help` output.
	*/
    alias?: string | string[];

    /**
	Parameters accepted by the command. Parameters must be in the following formats:
	- Required parameter: `<parameter name>`
	- Optional parameter: `[parameter name]`
	- Required spread parameter: `<parameter name...>`
	- Optional spread parameter: `[parameter name...]`
	*/
    parameters?: Parameters;

    /**
	Flags accepted by the command
	*/
    flags?: Flags;

    /**
	Options to configure the help documentation. Pass in `false` to disable handling `--help, -h`.
	*/
    help?: false | HelpOptions;
};

export declare const parsedType: unique symbol;

export type Flags = BaseFlags<{
    /**
	Description to be used in help output
	@example
	```
	description: 'Unit of output (metric, imperial)',
	```
	*/
    description?: string;

    /**
	Placeholder label to be used in help output
	@example Required value
	```
	placeholder: '<locale>'
	```
	*/
    placeholder?: string;
}>;

export type CallbackFunction<Parsed> = (parsed: {
    // This exposes the content of "TypeFlag<T>" in type hints
    [Key in keyof Parsed]: Parsed[Key];
}) => void;

type HasVersion<Options extends { flags?: Flags }> = Options extends { version: string }
    ? Options['flags'] & { version: BooleanConstructor }
    : Options['flags'];

type HasHelp<Options extends { flags?: Flags }> = Options extends { help: false }
    ? Options['flags']
    : Options['flags'] & { help: BooleanConstructor };

export type HasHelpOrVersion<Options> = HasVersion<Options> & HasHelp<Options>;

export type HelpDocumentNode<Types extends PropertyKey = keyof any> = {
    id?: string;
    type: Types;
    data: any;
};

export type HelpOptions = {
    /**
	Version of the script displayed in `--help` output. Use to avoid enabling `--version` flag.
	*/
    version?: string;

    /**
	Description of the script or command to display in `--help` output.
	*/
    description?: string;

    /**
	Usage code examples to display in `--help` output.
	*/
    usage?: false | string | string[];

    /**
	Example code snippets to display in `--help` output.
	*/
    examples?: string | string[];

    /**
	Function to customize the help document before it is logged.
	*/
    render?: (nodes: HelpDocumentNode<keyof any>[], renderers: any) => string;
};

export type CliOptions<Commands = Command[], Parameters extends string[] = string[]> = {
    /**
	Name of the script displayed in `--help` output.
	*/
    name?: string;

    /**
	Version of the script displayed in `--version` and `--help` outputs.
	*/
    version?: string;

    /**
	Parameters accepted by the script. Parameters must be in the following formats:
	- Required parameter: `<parameter name>`
	- Optional parameter: `[parameter name]`
	- Required spread parameter: `<parameter name...>`
	- Optional spread parameter: `[parameter name...]`
	*/
    parameters?: Parameters;

    /**
	Commands to register to the script.
	*/
    commands?: Commands;

    /**
	Flags accepted by the script
	*/
    flags?: Flags;

    /**
	Options to configure the help documentation. Pass in `false` to disable handling `--help, -h`.
	*/
    help?: false | HelpOptions;
};

export type CliOptionsInternal<Commands = Command[]> = CliOptions<Commands> & {
    parent?: CliOptions;
};

type kebabToCamel<Word extends string> = Word extends
    | `${infer Prefix}-${infer Suffix}`
    | `${infer Prefix} ${infer Suffix}`
    ? `${Prefix}${Capitalize<kebabToCamel<Suffix>>}`
    : Word;
type StripBrackets<Parameter extends string> = Parameter extends `<${infer ParameterName}>` | `[${infer ParameterName}]`
    ? ParameterName extends `${infer SpreadName}...`
        ? SpreadName
        : ParameterName
    : never;
type ParameterType<Parameter extends string> = Parameter extends
    | `<${infer _ParameterName}...>`
    | `[${infer _ParameterName}...]`
    ? string[]
    : Parameter extends `<${infer _ParameterName}>`
    ? string
    : Parameter extends `[${infer _ParameterName}]`
    ? string | undefined
    : never;

type WithCommand<Options extends { flags?: Flags }, Command extends string | undefined = undefined> = {
    command: Command;
} & Options;

type TypeFlagWrapper<Options extends { flags?: Flags }, Parameters extends string[]> = TypeFlag<
    HasHelpOrVersion<Options>
> & {
    _: {
        [Parameter in Parameters[number] as kebabToCamel<StripBrackets<Parameter>>]: ParameterType<Parameter>;
    };
    showHelp: (options?: HelpOptions) => void;
    showVersion: () => void;
};

export type ParseArgv<
    Options extends { flags?: Flags },
    Parameters extends string[],
    Command extends string | undefined = ''
> = Command extends ''
    ? TypeFlagWrapper<Options, Parameters>
    : WithCommand<TypeFlagWrapper<Options, Parameters>, Command>;
