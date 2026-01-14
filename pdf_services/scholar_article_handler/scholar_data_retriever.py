# scholar_handler.py

from pdf_services.config.settings import Config
from pdf_services.scholar_article_handler.scholar_pdf_downloader import ScholarPDFDownloader
from pdf_services.pdf_image_handler.image_processor import ImageProcessor
from pdf_services.pdf_ingestion.pdf_ingestion_manager import PDFIngestionManager
from pdf_services.vector_storage.vectorstore_manager import VectorStoreManager


class ScholarDataRetriever:
    
    def download_pdf(self, query: str, num_pdf: int, source: str) -> str:
        downloader = ScholarPDFDownloader()
        return downloader.download_gs_pdf(user_query=query, num_pdf=num_pdf, source=source)
        
    
    def ingest_scholar_pdf(self) -> str:
        vectorstore_manager = VectorStoreManager(Config.CHROMA_PATH)
        image_processor = ImageProcessor()
        ingestion_handler = PDFIngestionManager(vectorstore_manager, image_processor, dir_path=Config.DOWNLOAD_FOLDER)
        ingestion_handler.start_ingest()
        return True
    