export interface AIProvider {
    name: string;
    call: (model: string, systemPrompt: string, prompt: string) => Promise<string>;
}