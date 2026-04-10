import { AIProvider } from "../types";
import { OpenAIService } from "./providers/openai";

const ai_services = {
    [AIProvider.OPENAI]: new OpenAIService(),
}

export const getAIService = (provider: AIProvider) => {
    if (!ai_services[provider]) {
        throw new Error(`AI service ${provider} not found`);
    }
    return ai_services[provider];
};

