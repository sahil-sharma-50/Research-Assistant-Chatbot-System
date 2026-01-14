import sys
from os.path import abspath, dirname, realpath

PATH = realpath(abspath(__file__))
sys.path.insert(0, dirname(PATH))
sys.path.insert(0, dirname(dirname(PATH)))

import os
import shutil
from pathlib import Path

import uvicorn
from pdf_services.pdf_image_handler.image_processor import ImageProcessor
from pdf_services.pdf_ingestion.pdf_ingestion_manager import PDFIngestionManager
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from pdf_services.config.settings import Config
from pdf_services.vector_storage.vectorstore_manager import VectorStoreManager

pdf_ingestion = PDFIngestionManager(VectorStoreManager(), ImageProcessor())


app = FastAPI(title="EMB Chatbot")
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


@app.post("/upload-pdf", tags=["pdf_operations"])
async def upload_pdf(file: UploadFile):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    file_path = os.path.join(UPLOAD_PATH, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        result = pdf_ingestion.start_ingest()
        if isinstance(result, dict) and "message" in result:
            return result
        return {"message": "PDF processed and uploaded successfully!"}
    except Exception as e:
        raise {"message": f"Error occurred in processig PDF! Please try again."}


if __name__ == "__main__":
    uvicorn.run("pdf_main:app", host="0.0.0.0", port=8001, reload=False)
