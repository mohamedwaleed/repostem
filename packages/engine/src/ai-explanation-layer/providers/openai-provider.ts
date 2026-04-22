import { AIProvider } from "./ai-provider";
import OpenAI from "openai";

export class OpenAIPRovider implements AIProvider {
    name = "openai";
    client: OpenAI;
    model: string;
    
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set, please set it in your environment variables by running: export OPENAI_API_KEY=your_key");
        }
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.model = process.env.AI_MODEL || "gpt-4o";
    }
    
    async generateText(systemPrompt: string, prompt: string): Promise<string> {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set, please set it in your environment variables by running: export OPENAI_API_KEY=your_key");
        }
        if (!this.client) {
            throw new Error("OpenAI client is not initialized");
        }
        const response = await this.client.responses.create({
            model: this.model,
            instructions: systemPrompt,
            input: prompt,
        });
        return Promise.resolve(response.output_text);
    }
}