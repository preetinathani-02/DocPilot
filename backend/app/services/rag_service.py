from app.services.search_service import retrieve_context
from app.services.prompt_service import build_prompt
from app.services.llm_service import generate_response


def chat(query: str):

    contexts = retrieve_context(query)

    context_text = [
        context["text"]
        for context in contexts
    ]

    prompt = build_prompt(
        query=query,
        contexts=context_text
    )

    answer = generate_response(prompt)

    return {
        "answer": answer,
        "sources": contexts,
    }