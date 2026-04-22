export interface AIProvider {
    name: string;
    client: any;
    model: string;
    generateText: (systemPrompt: string, prompt: string) => Promise<string>;
}