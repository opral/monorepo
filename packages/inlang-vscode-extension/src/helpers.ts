import * as fs from "fs";
import * as path from "path";

// import { createClient, PostgrestResponse } from "@supabase/supabase-js";
import translate, { DeeplLanguages } from 'deepl';
import { type } from "os";

/* export type inlangConfig = {
    ProjectId: string
} */

export function applyWrappingPattern(pattern: inlangConfig, content: string) {
    return pattern.vsCodeExtension.wrappingPattern.replace('keyname', content)
}
export type inlangConfig = {
    projectId: string,
    vsCodeExtension: {
        wrappingPattern: string
    }
}

export function readConfig(path: string) {
    let obj = fs.readFileSync(path, 'utf8')
    let jo: inlangConfig = JSON.parse(obj)
    return jo
}

/* export async function pgResp2val<t>(x: PostgrestResponse<t>, errname: string = ''): Promise<t[]> {
    if (x.error || x.data === null) {
        if (errname != '') console.log(errname)
        console.log(x.error)
        throw 'oops'
    } else {
        return x.data;
    }
} */


/* const supabase = createClient(
    "http://localhost:8000",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew"
); */

/* export async function writeDb(pid: string, key: string, text: string) {
    let tr: translationT = {
        key_name: key,
        project_id: pid,
        iso_code: "de",
        is_reviewed: false,
        text: text,
        created_at: ""
    }
    const { data, error } = await supabase
        .from("translation")
        .insert([
            tr
        ])

} */

export function ensureDirectoryExistence(filePath: string) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

/*
export type inlangConfig = {
    ProjectId: string,
    supabase_url: string,
    supabase_secret: string
}} */


type translationT = {
    /**
     * Note:
     * This is a Primary Key.<pk/>
     * This is a Foreign Key to `key.name`.<fk table='key' column='name'/>
     */
    key_name: string;
    /**
     * Note:
     * This is a Primary Key.<pk/>
     * This is a Foreign Key to `key.project_id`.<fk table='key' column='project_id'/>
     */
    project_id: string;
    /**
     * Note:
     * This is a Primary Key.<pk/>
     */
    iso_code:
    | "ab"
    | "aa"
    | "af"
    | "ak"
    | "sq"
    | "am"
    | "ar"
    | "an"
    | "hy"
    | "as"
    | "av"
    | "ae"
    | "ay"
    | "az"
    | "bm"
    | "ba"
    | "eu"
    | "be"
    | "bn"
    | "bh"
    | "bi"
    | "bs"
    | "br"
    | "bg"
    | "my"
    | "ca"
    | "km"
    | "ch"
    | "ce"
    | "ny"
    | "zh"
    | "cu"
    | "cv"
    | "kw"
    | "co"
    | "cr"
    | "hr"
    | "cs"
    | "da"
    | "dv"
    | "nl"
    | "dz"
    | "en"
    | "eo"
    | "et"
    | "ee"
    | "fo"
    | "fj"
    | "fi"
    | "fr"
    | "ff"
    | "gd"
    | "gl"
    | "lg"
    | "ka"
    | "de"
    | "ki"
    | "el"
    | "kl"
    | "gn"
    | "gu"
    | "ht"
    | "ha"
    | "he"
    | "hz"
    | "hi"
    | "ho"
    | "hu"
    | "is"
    | "io"
    | "ig"
    | "id"
    | "ia"
    | "ie"
    | "iu"
    | "ik"
    | "ga"
    | "it"
    | "ja"
    | "jv"
    | "kn"
    | "kr"
    | "ks"
    | "kk"
    | "rw"
    | "kv"
    | "kg"
    | "ko"
    | "kj"
    | "ku"
    | "ky"
    | "lo"
    | "la"
    | "lv"
    | "lb"
    | "li"
    | "ln"
    | "lt"
    | "lu"
    | "mk"
    | "mg"
    | "ms"
    | "ml"
    | "mt"
    | "gv"
    | "mi"
    | "mr"
    | "mh"
    | "ro"
    | "mn"
    | "na"
    | "nv"
    | "nd"
    | "ng"
    | "ne"
    | "se"
    | "no"
    | "nb"
    | "nn"
    | "ii"
    | "oc"
    | "oj"
    | "or"
    | "om"
    | "os"
    | "pi"
    | "pa"
    | "ps"
    | "fa"
    | "pl"
    | "pt"
    | "qu"
    | "rm"
    | "rn"
    | "ru"
    | "sm"
    | "sg"
    | "sa"
    | "sc"
    | "sr"
    | "sn"
    | "sd"
    | "si"
    | "sk"
    | "sl"
    | "so"
    | "st"
    | "nr"
    | "es"
    | "su"
    | "sw"
    | "ss"
    | "sv"
    | "tl"
    | "ty"
    | "tg"
    | "ta"
    | "tt"
    | "te"
    | "th"
    | "bo"
    | "ti"
    | "to"
    | "ts"
    | "tn"
    | "tr"
    | "tk"
    | "tw"
    | "ug"
    | "uk"
    | "ur"
    | "uz"
    | "ve"
    | "vi"
    | "vo"
    | "wa"
    | "cy"
    | "fy"
    | "wo"
    | "xh"
    | "yi"
    | "yo"
    | "za"
    | "zu";
    is_reviewed: boolean;
    text: string;
    created_at: string;
}