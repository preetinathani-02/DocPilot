from openai import OpenAI

from app.services.llm.base import BaseLLM


class OpenAILLM(BaseLLM):

    def __init__(
        self,
        api_key,
        model,
    ):

        self.client = OpenAI(
            api_key=api_key
        )

        self.model = model

    def generate_response(
        self,
        prompt,
    ):

        response = self.client.chat.completions.create(

            model=self.model,

            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        return response.choices[0].message.content