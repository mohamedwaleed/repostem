import { AIProvider } from "./AIProvider";
import OpenAI from "openai";

export class OpenAIService implements AIProvider {
    name = "openai";
    
    async call(model: string, systemPrompt: string, prompt: string): Promise<string> {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set");
        }
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const response = await client.responses.create({
            model: model,
            instructions: systemPrompt,
            input: prompt,
        });
        return Promise.resolve(response.output_text);
    }
}