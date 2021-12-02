// import * as fs from 'fs'
// import * as path from 'path'
// import { InlangVsCodeExtensionConfig } from './types/inlangVsCodeExtensionConfig'

// /* export type inlangConfig = {
//     ProjectId: string
// } */

// export function applyWrappingPattern(
//     pattern: InlangVsCodeExtensionConfig,
//     content: string
// ) {
//     return pattern.wrappingPattern.replace('keyname', content)
// }

// export function readAndValidateConfig(
//     path: string
// ): {
//     data: InlangVsCodeExtensionConfig | null
//     error: string | null
// } {
//     let file = ''
//     try {
//         file = fs.readFileSync(path, 'utf8')
//     } catch (error) {
//         return {
//             data: null,
//             error: 'The config file at ' + path + ' has not been found.',
//         }
//     }
//     const configValidation = validateConfig({ config: JSON.parse(file) })
//     if (configValidation.isValid === true) {
//         return {
//             data: JSON.parse(file),
//             error: null,
//         }
//     }
//     return {
//         data: null,
//         error: configValidation.reason,
//     }
// }

// /**
//  * Passing args.config as unknown.
//  *
//  * Casting it to InlangConfig to get some sort of auto-complete. However,
//  * all variables have to be null checked now manually.
//  *
//  */
// function validateConfig(args: {
//     config: unknown
// }): {
//     isValid: boolean
//     reason: string | null
// } {
//     const casted = args.config as InlangVsCodeExtensionConfig
//     if (args.config === undefined) {
//         return { isValid: false, reason: 'no config ' }
//     } else if (casted.projectId === undefined) {
//         return {
//             isValid: false,
//             reason: 'inlang.config.json missing projectId',
//         }
//     } else if (casted.vsCodeExtension === undefined) {
//         return {
//             isValid: false,
//             reason: 'field "vsCodeExtension" is missing in config',
//         }
//     } else if (casted.vsCodeExtension.wrappingPattern === undefined) {
//         return {
//             isValid: false,
//             reason: 'field "wrappingPattern" is missing in config',
//         }
//     }
//     return { isValid: true, reason: null }
// }

// export function ensureDirectoryExistence(filePath: string): void {
//     const dirname = path.dirname(filePath)
//     if (fs.existsSync(dirname)) {
//         return
//     }
//     ensureDirectoryExistence(dirname)
//     fs.mkdirSync(dirname)
// }
