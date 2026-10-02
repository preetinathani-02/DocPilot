from google import genai

from app.services.llm.base import BaseLLM


class GeminiLLM(BaseLLM):

    def __init__(
        self,
        api_key: str,
        model: str,
    ):
        self.client = genai.Client(
            api_key=api_key
        )

        self.model = model

    def generate_response(
        self,
        prompt: str,
    ) -> str:

        response = self.client.models.generate_content(

            model=self.model,

            contents=prompt,
        )

        return response.text