import type { Lix } from "../../lix/open-lix.js";

/**
 * Key value storage interface.
 */
export type LspEnvironment = {
	getLix(args: { id: string }): Promise<Blob | undefined>;

	/**
	 * If a lix exists on the server.
	 */
	hasLix(args: { id: string }): Promise<boolean>;

	/**
	 * Set's a lix.
	 */
	setLix(args: { id: string; blob: Blob }): Promise<void>;

	/**
	 * Opens a lix.
	 *
	 * The server will return a connection id that can be used to close the lix.
	 */
	openLix(args: {
		id: string;
	}): Promise<{ lix: Lix; id: string; connectionId: string }>;
	/**
	 * Closes a lix.
	 *
	 * The connection id is returned when opening a lix.
	 *
	 * @example
	 *   const { lix, connectionId } = await openLix({ id: 'my-lix' });
	 *   // do stuff with the lix
	 *   await closeLix({ connectionId });
	 */
	closeLix(args: { id: string; connectionId: string }): Promise<void>;
};

// For backward compatibility
export type LsaEnvironment = LspEnvironment;
