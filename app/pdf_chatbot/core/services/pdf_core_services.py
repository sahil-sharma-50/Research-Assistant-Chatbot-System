from pathlib import Path
from datetime import datetime
from fastapi.responses import FileResponse, JSONResponse
import os
import shutil
from urllib.parse import quote
from pdf_chatbot.utils.remove import RemovePDF
from pdf_chatbot.core.services.config import Config


class PdfCoreServices:
    def __init__(self, dest_path: Path=Config.DEST_FOLDER, download_folder: Path=Config.DOWNLOAD_FOLDER):
        self.dest_path = Path(dest_path)
        self.download_folder = Path(download_folder)

    def list_pdfs(self):
        """List all PDFs with their details."""
        pdfs = [
            {
                "name": pdf_file.name,
                "size": round(pdf_file.stat().st_size / 1024, 2),  # Size in KB
                "date": datetime.fromtimestamp(pdf_file.stat().st_mtime).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                "path": f"/pdfs/{pdf_file.name}",
            }
            for pdf_file in self.dest_path.glob("*.pdf")
        ]
        return pdfs

    def get_pdf(self, pdf_name: str):
        """Serve an individual PDF file."""
        pdf_path = self.dest_path / pdf_name
        if pdf_path.exists() and pdf_path.suffix == ".pdf":
            encoded_filename = quote(pdf_name)
            headers = {
                "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
                "Content-Type": "application/pdf",
            }
            return FileResponse(
                path=pdf_path,
                media_type="application/pdf",
                headers=headers,
            )
        return {"error": "PDF not found"}

    def delete_pdf(self, pdf_name: str):
        """Delete a specific PDF and its embeddings."""
        response_delete_pdf = RemovePDF().delete_pdf(pdf_name)
        if response_delete_pdf == "Success":
            response_delete_embeddings = RemovePDF().delete_embeddings(pdf_name)
            if response_delete_embeddings != "Success":
                return response_delete_embeddings
        return response_delete_pdf

    def clear_pdf_folder(self, folder_path: str = Config.DOWNLOAD_FOLDER):
        """Clear the folder containing Downloaded PDFs."""
        try:
            if os.path.exists(folder_path):
                for file in os.listdir(folder_path):
                    file_path = os.path.join(folder_path, file)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                return {"message": "Folder cleared successfully."}
            else:
                return {"error": "Folder does not exist."}
        except Exception as e:
            return {"error": str(e)}

    def list_downloaded_pdfs(self):
        """List all downloaded PDFs."""
        pdf_directory = self.download_folder
        if os.path.exists(pdf_directory):
            pdf_files = [f for f in os.listdir(pdf_directory) if f.endswith(".pdf")]
            return {"pdfs": pdf_files}
        else:
            return {"pdfs": []}

    def get_downloaded_pdf(self, pdf_name: str):
        """Serve an individual downloaded PDF."""
        pdf_path = self.download_folder / pdf_name
        if pdf_path.exists() and pdf_path.suffix == ".pdf":
            encoded_filename = quote(pdf_name)
            headers = {
                "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
                "Content-Type": "application/pdf",
            }
            return FileResponse(
                path=pdf_path,
                media_type="application/pdf",
                headers=headers,
            )
        return {"error": "PDF not found"}

    def delete_unselected_pdfs(self, selected_pdfs: list[str]):
        """Delete PDFs not in the selected list."""
        all_pdfs = [pdf for pdf in self.download_folder.glob("*.pdf")]
        for pdf in all_pdfs:
            if pdf.name not in selected_pdfs:
                os.remove(pdf)
        return {"message": "Unselected PDFs deleted"}
