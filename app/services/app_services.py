"""Module to serve the chatbot as a FastAPI service."""

import sys
from os.path import abspath, dirname, realpath
from uuid import uuid4

PATH = realpath(abspath(__file__))
sys.path.insert(0, dirname(dirname(PATH)))

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models.query import Query
from pdf_chatbot.core.query.query_handler import PDFQuery
from pdf_chatbot.core.services.pdf_core_services import PdfCoreServices
from services.services import Services

from pdf_services.config.settings import Config
from pdf_services.pdf_image_handler.image_processor import ImageProcessor
from pdf_services.pdf_ingestion.pdf_ingestion_manager import PDFIngestionManager
from pdf_services.vector_storage.vectorstore_manager import VectorStoreManager

pdf_ingestion = PDFIngestionManager(VectorStoreManager(), ImageProcessor())

app_services = Services()
pdf_core_services = PdfCoreServices()

app = FastAPI(title="Research Chatbot")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_PATH = Config.PDF_FOLDER
DEST_PATH = Path(Config.DEST_FOLDER)
CHROMA_PATH = Config.CHROMA_PATH


@app.post("/reset_conversation", tags=["reset"])
async def reset_conversation(session_id: str):
    return app_services.reset_conversation(session_id)


# PDF Operations:
@app.post("/query_pdf", tags=["query"])
async def query_pdf(
    query: PDFQuery, session_id: str = uuid4().hex, llm_model: str = "4o"
):
    return app_services.query_pdf_answer(query, session_id, llm_model)


@app.post("/download_pdf", tags=["query"])
async def download_pdf(query: PDFQuery):
    return app_services.download_pdf_from_scholar(query)


@app.post("/upload_scholar_pdf", tags=["query"])
async def upload_scholar_pdf():
    return app_services.upload_scholar_pdf()


@app.get("/pdfs", tags=["pdf_operations"])
async def list_pdfs():
    return pdf_core_services.list_pdfs()


@app.get("/pdfs/{pdf_name}", tags=["pdf_operations"])
async def get_pdf(pdf_name: str):
    return pdf_core_services.get_pdf(pdf_name)


@app.delete("/deletepdf/{pdf_name}", tags=["pdf_operations"])
async def delete_pdf(pdf_name: str):
    return pdf_core_services.delete_pdf(pdf_name)


@app.post("/clear-pdf-folder")
async def clear_pdf_folder():
    response = pdf_core_services.clear_pdf_folder()
    return JSONResponse(
        content=response, status_code=200 if "message" in response else 500
    )


@app.get("/list-downloaded-pdfs")
async def list_downloaded_pdfs():
    return pdf_core_services.list_downloaded_pdfs()


@app.get("/downloaded-pdfs/{pdf_name}", tags=["pdf_operations"])
async def get_downloaded_pdf(pdf_name: str):
    return pdf_core_services.get_downloaded_pdf(pdf_name)


@app.post("/delete_unselected_pdfs")
async def delete_unselected_pdfs(selected_pdfs: list[str]):
    return pdf_core_services.delete_unselected_pdfs(selected_pdfs)
