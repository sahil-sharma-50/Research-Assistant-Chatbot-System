import chromadb
import os
from pathlib import Path
from pdf_chatbot.core.services.config import Config


class RemovePDF:
    """Delete PDFs and their embeddings."""
    def __init__(self):
        pass
    def delete_embeddings(self,pdf_name):
        parts = pdf_name.split("__")
        if len(parts) >= 3:
            pdf_title = parts[2]
            pdf_title = pdf_title.replace(".pdf", "")
        else:
            pdf_title = None
        
        try:
            client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
            collection = client.get_collection(name="multi_modal_rag")
        except:
            return {"Error": "Can't connect to ChromaDB"}

        # Get the PDF embeddings for the given PDF title
        pdfs=collection.get(
            where={'title':pdf_title}
        )
        if pdfs['ids']==[]:
            return {"Error": f"PDF embeddings not found for PDF: {pdf_title}"}  

        try:  
            collection.delete(
                ids=pdfs['ids']
            )
            return "Success"      
        except:
            return  {"Error": f"Cannot delete embeddings for PDF: {pdf_name}"}  

    def delete_pdf(self,pdf_name):
        """Delete a specific PDF file."""
        DEST_PATH = Path(Config.DEST_FOLDER)
        pdf_path = DEST_PATH / pdf_name
        # Check if the file exists
        if not os.path.exists(pdf_path):
            return {"error": "404 PDF not found"}
        try:
            # Delete the file
            os.remove(pdf_path)
            return "Success"
        except Exception as e:
            return {"error": f"500 Error deleting PDF: {pdf_name}"}
