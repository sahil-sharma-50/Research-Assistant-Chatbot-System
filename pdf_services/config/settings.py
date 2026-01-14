import os


class Config:
    # Default ChatBot Model
    MODEL = "gpt-4o"
    
    # ChromaDB settings
    CHROMA_PATH = "data/pdf_embeddings"

    # pdf_ingestion_manager.py
    PDF_FOLDER = "data/uploaded_pdfs"
    os.makedirs(PDF_FOLDER, exist_ok=True)
    
    DEST_FOLDER = "data/all_processed_pdfs"
    os.makedirs(DEST_FOLDER, exist_ok=True)
    
    DOWNLOAD_FOLDER = "data/scholarly_downloaded_pdfs"
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

    # scholar_pdf_downloader.py
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/110.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,"
            "image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
        ),
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
    }

    # images_extractor.py
    DPI = 300
    SCALE_FACTOR = 4
    PIXELS_PER_POINT = DPI / 72

    # Margins for image detection
    LEFT_MARGIN = 200
    RIGHT_MARGIN = 200
    TOP_MARGIN = 200
    BOTTOM_MARGIN = 200
    THRESHOLD = 254

    # Minimum image size settings
    MIN_WIDTH_PIXELS = 50
    MIN_HEIGHT_PIXELS = 50

    # Output settings
    OUTPUT_FOLDER = "extracted_images"
