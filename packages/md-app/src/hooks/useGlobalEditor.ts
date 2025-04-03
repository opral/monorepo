import { editorRefAtom } from '@/state';
import { useAtom } from 'jotai';

/**
 * Custom hook to access the Plate editor instance from anywhere in the app
 * 
 * @returns The Plate editor instance or null if not available
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const editor = useGlobalEditor();
 *   
 *   const handleClick = () => {
 *     if (editor) {
 *       // Use editor API here
 *       const markdown = editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();
 *       // ...other operations
 *     }
 *   };
 *   
 *   return <button onClick={handleClick}>Get Markdown</button>;
 * };
 * ```
 */
export const useGlobalEditor = () => {
  const [editorRef] = useAtom(editorRefAtom);
  return editorRef;
};