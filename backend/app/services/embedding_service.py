import google.generativeai as genai
from app.core.config import settings

# Global cache for the local model (only loaded if local model is used)
_local_model = None

def get_local_model():
    global _local_model
    if _local_model is None:
        try:
            print("[Embedding Service] Loading local SentenceTransformer model (this will consume significant RAM)...")
            from sentence_transformers import SentenceTransformer
            _local_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        except ImportError:
            raise ImportError(
                "sentence-transformers and PyTorch are not installed in this environment. "
                "If you are running in a memory-constrained container (like Render), please configure "
                "EMBEDDING_MODEL in your environment variables to use a cloud API model "
                "(e.g., 'models/text-embedding-004') and set EMBEDDING_DIMENSION=768."
            )
    return _local_model

def is_gemini_model() -> bool:
    model_name = settings.EMBEDDING_MODEL.lower()
    return "text-embedding" in model_name or "gemini" in model_name

def create_embedding(text: str) -> list[float]:
    if is_gemini_model():
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = settings.EMBEDDING_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        result = genai.embed_content(
            model=model_name,
            content=text,
            output_dimensionality=settings.EMBEDDING_DIMENSION,
        )
        return result['embedding']
    else:
        model = get_local_model()
        return model.encode(text).tolist()

def create_embeddings(texts: list[str] | str) -> list[list[float]] | list[float]:
    if is_gemini_model():
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = settings.EMBEDDING_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        result = genai.embed_content(
            model=model_name,
            content=texts,
            output_dimensionality=settings.EMBEDDING_DIMENSION,
        )
        return result['embedding']
    else:
        model = get_local_model()
        return model.encode(texts).tolist()