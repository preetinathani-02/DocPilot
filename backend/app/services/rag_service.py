from app.services.search_service import retrieve_context
from app.services.prompt_service import build_prompt
from app.services.llm.factory import LLMFactory


def chat(
    query: str,
    provider: str,
    api_key: str,
    model: str,
):

    contexts = retrieve_context(query)

    context_text = [
        context["text"]
        for context in contexts
    ]

    prompt = build_prompt(
        query=query,
        contexts=context_text
    )

    llm = LLMFactory.get_llm(
        provider,
        api_key,
        model,
    )

    answer = llm.generate_response(
        prompt
    )

    return {
        "answer": answer,
        "sources": contexts,
    }