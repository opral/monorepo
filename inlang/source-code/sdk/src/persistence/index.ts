// import type { NodeishFilesystem } from "@lix-js/fs";
// import { InlangProject } from "../index.js";

// /**
//  * initializes the persistenc
//  * - returns the legacy message query that triggers when messages changed internaly
//  * - 
//  * @param fs
//  * @returns 
//  */
// async function initPersistence(fs: NodeishFilesystem) {

//     // TODO create a legacyMessageQuery adapter based on a weak map as thin layer that produces signals when needed
//     let legacyMessageQuery: InlangProject["query"]["messages"];

//     // message cache
//     let messageState: {
//         [messageId: string]: AST.Message
//     } = {};

//     return {
//         legacyMessageQuery,

//     }
// }