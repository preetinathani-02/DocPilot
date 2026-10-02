from app.services.llm.gemini import GeminiLLM
from app.services.llm.openai import OpenAILLM
from app.services.llm.claude import ClaudeLLM


class LLMFactory:

    @staticmethod
    def get_llm(
        provider,
        api_key,
        model,
    ):

        provider = provider.lower()

        if provider == "gemini":
            return GeminiLLM(
                api_key,
                model,
            )

        if provider == "openai":
            return OpenAILLM(
                api_key,
                model,
            )

        if provider == "claude":
            return ClaudeLLM(
                api_key,
                model,
            )

        raise ValueError(
            f"{provider} not supported."
        )