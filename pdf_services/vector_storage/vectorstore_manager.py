import uuid
from typing import List

from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from pdf_services.config.settings import Config


class VectorStoreManager:
    def __init__(self, vectorstore_path: str = Config.CHROMA_PATH):
        self.vectorstore = Chroma(
            collection_name="multi_modal_rag",
            embedding_function=OpenAIEmbeddings(model="text-embedding-3-large"),
            persist_directory=vectorstore_path,
        )

    def get_existing_ids(self) -> set:
        """Get existing IDs from the ChromaDB."""
        existing_items = self.vectorstore.get(include=[])
        return set(existing_items["ids"])
    
    def get_source_and_title_by_id(self, chunk_id):
        result = self.vectorstore.get(ids=[chunk_id])
        if result['metadatas']:
            metadata = result['metadatas'][0]  # The metadata for the first result
            return metadata
        else:
            return None

    def add_to_chroma(
        self,
        img_base64: List[str],
        image_summaries: List[str],
        new_chunks: List[Document],
        pdf_name: str,
        source_path: str,
        year: int,
    ) -> None:
        """Add new chunks and images to ChromaDB."""

        seen_chunk_ids = set()
        unique_chunks = []
        duplicates = []
        for chunk in new_chunks:
            chunk_id = chunk.metadata["id"]
            if chunk_id in seen_chunk_ids:
                duplicates.append(chunk)
            else:
                seen_chunk_ids.add(chunk_id)
                unique_chunks.append(chunk)

        # Adding text chunks
        self.vectorstore.add_documents(
            unique_chunks, ids=[chunk.metadata["id"] for chunk in unique_chunks]
        )

        # Adding image summaries
        if not img_base64:
            return
        img_ids = [str(uuid.uuid4()) for _ in img_base64]
        summary_img = [
            Document(
                page_content=s,
                metadata={
                    "doc_id": img_ids[i],
                    "title": pdf_name,
                    "source": source_path,
                    "year": year,
                },
            )
            for i, s in enumerate(image_summaries)
        ]
        self.vectorstore.add_documents(summary_img)
