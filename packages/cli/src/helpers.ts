import { PostgrestResponse } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

export async function pgResp2val<t>(x: PostgrestResponse<t>, errname: string = ''): Promise<t[]> {
    if (x.error || x.data === null) {
        if (errname != '') console.log(errname)
        console.log(x.error)
        throw 'oops'
    } else {
        return x.data;
    }
}


export function ensureDirectoryExistence(filePath: string) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}