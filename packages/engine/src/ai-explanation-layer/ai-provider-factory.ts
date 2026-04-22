import { AIProvider } from "../types";
import { OpenAIPRovider } from "./providers/openai-provider";

const ai_services = {
    [AIProvider.OPENAI]: OpenAIPRovider,
}

export const aiProviderFactory = () => {
    const providerName = (process.env.AI_PROVIDER || "openai") as AIProvider;
    if (!ai_services[providerName]) {
        throw new Error(`AI service ${providerName} not found`);
    }
    return new ai_services[providerName]();
};

