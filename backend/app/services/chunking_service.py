from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.schemas.document import Chunk

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

def create_chunks(text: str, filename: str):
    chunks = splitter.split_text(text)

    results = []

    for index, chunk in enumerate(chunks):
        results.append(
            Chunk(
                chunk_id=index + 1,
                text=chunk,
                metadata={
                    "source": filename
                }
            )
        )

    return results