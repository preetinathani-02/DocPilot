def build_prompt(
    query: str,
    contexts: list[str],
) -> str:

    context = "\n\n".join(contexts)

    return f"""
        You are DocPilot AI.
        Answer ONLY using the provided context.
        If the answer cannot be found in the context, reply:
        "I couldn't find that information in the uploaded documents."
        Do not make up facts.

        Context:
        {context}
        Question:

        {query}

        Answer:
    """