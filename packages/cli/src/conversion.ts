import { definitions } from "@inlang/database";
import * as fs from 'fs'

// json file format 
export type jsonFormat = { key_id: number, text: string }


export function db2json(x: definitions['translation']): jsonFormat {
    // let r = { key_id: x.key_id, text: x.text }
    let r = { key_id: 1, text: x.text }
    return r;
}

export function json2file(x: jsonFormat[]) {
    fs.writeFile('', "", x => { })
}