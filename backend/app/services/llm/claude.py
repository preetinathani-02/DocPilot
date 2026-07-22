from anthropic import Anthropic

from app.services.llm.base import BaseLLM


class ClaudeLLM(BaseLLM):

    def __init__(
        self,
        api_key,
        model,
    ):

        self.client = Anthropic(
            api_key=api_key
        )

        self.model = model

    def generate_response(
        self,
        prompt,
    ):

        response = self.client.messages.create(

            model=self.model,

            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        return response.choices[0].message.content