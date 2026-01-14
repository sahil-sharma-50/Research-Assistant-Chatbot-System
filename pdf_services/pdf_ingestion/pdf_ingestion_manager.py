"""
ingest_pdfs.py

It processes PDFs by extracting text and images, splitting the text into chunks,
and storing both the text and image summaries in the ChromaDB vector store.
To prevent duplicates, the script checks for new PDFs by generating a unique hash
(using hashlib) based on the content of each PDF before adding them to the vector store.
"""

import hashlib
import os
import shutil
import uuid
from typing import List, Tuple

from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_community.document_loaders import PDFMinerLoader
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pdf_services.config.settings import Config

from pdf_services.pdf_image_handler.image_extractor import ImageExtractor
from pdf_services.pdf_image_handler.image_summarizer import ImageSummarizer


class PDFIngestionManager:
    def __init__(self, vectorstore, image_processor, dir_path=Config.PDF_FOLDER):
        self.dir_path = dir_path
        self.vectorstore = vectorstore
        self.image_processor = image_processor

    def start_ingest(self) -> None:
        """
        Process PDFs and add their content (text and images) to ChromaDB vector store.
        """
        has_new_pdf = False
        pdf_files = [
            filename
            for filename in os.listdir(self.dir_path)
            if filename.endswith(".pdf")
        ]

        if not pdf_files:
            print("📁 No PDF files found in the directory.")
            return

        for idx, filename in enumerate(pdf_files, start=1):
            pdf_path = os.path.join(self.dir_path, filename)
            file_in_dest_path = os.path.join(Config.DEST_FOLDER, filename)
            if os.path.exists(file_in_dest_path):
                os.remove(pdf_path)
                continue
                # return {"message": "PDF already exists!"}
            
            metadata = self.extract_metadata_from_filename(filename)
            print(f"Processing PDF '{filename[:50]}': {idx}/{len(pdf_files)}")

            # Load and split documents
            documents = self.load_documents(pdf_path, metadata)
            chunks = self.split_documents(documents)

            # Get the content-based hash for the PDF
            pdf_hash = self.generate_pdf_hash(self.get_pdf_content(pdf_path))

            chunks_with_ids = self.calculate_chunk_ids(chunks, pdf_hash)

            existing_ids = self.vectorstore.get_existing_ids()

            new_chunks = [
                chunk
                for chunk in chunks_with_ids
                if chunk.metadata["id"] not in existing_ids
            ]

            if new_chunks:
                has_new_pdf = True
                # image_extractor = ImageExtractor(pdf_path=pdf_path)
                images = self.image_processor.extract_images(pdf_path=pdf_path)
                # images = image_extractor.extract_images()
                img_base64, image_summaries = self.image_processor.summarize_images(
                    images
                )

                # Extract PDF name from path
                pdf_name = metadata.get("title", "Unknown")
                year = metadata.get("year", "Unknown")
                self.vectorstore.add_to_chroma(
                    img_base64, image_summaries, new_chunks, pdf_name, pdf_path, year
                )
                self.move_pdf_to_processed(pdf_path, filename)
            else:
                os.remove(pdf_path)
                print(f"PDF {filename} already exists in the database.")
                metadata = self.vectorstore.get_source_and_title_by_id(chunks_with_ids[0].metadata.get("id"))
                if metadata:
                    source = metadata.get('source', '')
                    source = os.path.basename(source)
                    title = metadata.get('title', '')
                    return {"message": f'PDF already exists!! with Filename: "{source}" and Title: "{title}"'}
                return {"message": "PDF already exists !"}

        print(
            "✅ Documents added successfully!"
            if has_new_pdf
            else "📁 No new PDFs to add!"
        )
        return {"message": "PDF already exists!"} if not has_new_pdf else {"message": "PDF processed and uploaded successfully!"}
    
    
    def move_pdf_to_processed(self, pdf_path: str, filename: str) -> None:
        """Move the processed PDF to the destination folder."""
        destination_path = os.path.join(Config.DEST_FOLDER, filename)
        shutil.move(pdf_path, destination_path)

    @staticmethod
    def extract_metadata_from_filename(filename: str) -> dict:
        """Extract metadata from the filename."""
        filename = filename.split("\\")[-1]
        filename = os.path.splitext(filename)[0]
        parts = filename.split("__")

        if len(parts) == 3:
            author, year, title = parts
            doi = "Unknown"
        elif len(parts) == 4:
            author, year, title, doi = parts
        else:
            return {
                "author": "Unknown",
                "year": "Unknown",
                "title": filename,
                "doi": "Unknown",
            }
        try:
            year = int(year)
        except ValueError:
            year = "Unknown"

        return {"author": author, "year": year, "title": title, "doi": doi}

    def load_documents(self, pdf_path: str, metadata: dict) -> List[Document]:
        """Load the documents from the PDF."""
        document_loader = PDFMinerLoader(pdf_path)
        documents = document_loader.load()

        for document in documents:
            document.metadata.update(metadata)

        return documents

    @staticmethod
    def get_pdf_content(pdf_path: str) -> bytes:
        """Read the content of the PDF file."""
        with open(pdf_path, "rb") as file:
            return file.read()

    @staticmethod
    def generate_pdf_hash(content: bytes) -> str:
        """Generate a unique hash for the entire PDF."""
        return hashlib.sha256(content).hexdigest()

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split the documents into chunks."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=100, separators=["\n\n", "\n", "."]
        )
        return text_splitter.split_documents(documents)

    def calculate_chunk_ids(
        self, chunks: List[Document], pdf_hash: str
    ) -> List[Document]:
        """Generate unique IDs for each chunk."""
        for chunk in chunks:
            chunk_hash = self.generate_pdf_hash(chunk.page_content.encode())
            chunk_id = f"{pdf_hash}:{chunk_hash}"
            chunk.metadata["id"] = chunk_id
        return chunks


# Usuage:
# if __name__ == "__main__":
#     from retriever.vector_storage.vectorstore_manager import VectorStoreManager
#     from ingestion.image_processing.image_processor import ImageProcessor
#     from ingestion.pdf_ingestion.pdf_ingestion_manager import PDFIngestionManager

#     vectorstore_manager = VectorStoreManager(Config.CHROMA_PATH)
#     image_processor = ImageProcessor()
#     ingestion_handler = PDFIngestionManager(vectorstore_manager, image_processor)
#     ingestion_handler.start_ingest()
