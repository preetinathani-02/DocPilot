from google import genai
from google.genai.errors import ClientError

from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


def generate_response(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model=settings.LLM_MODEL,
            contents=prompt,
        )
        return response.text

    except ClientError as e:
        raise RuntimeError(f"Gemini API Error: {e}")