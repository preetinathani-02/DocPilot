from app.services.vector_service import search_similar_chunks

def search_documents(query: str):
    return search_similar_chunks(query)