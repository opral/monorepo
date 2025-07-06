import { useContext } from "react";
import { LixContext } from "../provider.js";

/**
 * Hook to access the Lix instance from the context.
 * Must be used within a LixProvider.
 *
 * @example
 * ```tsx
 * function CreateAccountButton() {
 *   const lix = useLix();
 *
 *   const handleClick = async () => {
 *     await lix.db
 *       .insertInto('account')
 *       .values({
 *         name: 'John Doe',
 *       })
 *       .execute();
 *   };
 *
 *   return (
 *     <button onClick={handleClick}>
 *       Create Account
 *     </button>
 *   );
 * }
 * ```
 */
export function useLix() {
	const lix = useContext(LixContext);
	if (!lix) {
		throw new Error("useLix must be used inside <LixProvider>.");
	}
	return lix;
}
