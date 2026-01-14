import os

class Config:
    CHROMA_PATH = "data/pdf_embeddings"
    PDF_FOLDER = "data/uploaded_pdfs"
    DEST_FOLDER = "data/all_processed_pdfs"
    DOWNLOAD_FOLDER = "data/scholarly_downloaded_pdfs"
    
    os.makedirs(DEST_FOLDER, exist_ok=True)
    os.makedirs(PDF_FOLDER, exist_ok=True)
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
    
    