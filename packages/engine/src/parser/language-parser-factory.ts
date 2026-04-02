
import { Language } from "../types";
import { TypeScriptParser } from "./languages/typescript/typescript";
import { JavaScriptParser } from "./languages/javascript/javascript";

const parsers = {
    [Language.typescript]: new TypeScriptParser(),
    [Language.javascript]: new JavaScriptParser()
};
export default function getLanguageParser(language: Language) {

    if(!Object.keys(parsers).includes(language)) {
        throw new Error("Unsupported language");
    }
    
    return parsers[language];
}
