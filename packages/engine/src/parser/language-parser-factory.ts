
import { Language } from "../types";
import { TypeScriptParser } from "./languages/typescript";
import { JavaScriptParser } from "./languages/javascript";

const parsers = {
    [Language.typescript]: new TypeScriptParser(),
    [Language.javascript]: new JavaScriptParser()
};
export default function getLanguageParser(language: Language) {
    switch (language) {
        case Language.typescript:
            return parsers[Language.typescript];
        case Language.javascript:
            return parsers[Language.javascript];
        default:
            throw new Error("Unsupported language");
    }
}
