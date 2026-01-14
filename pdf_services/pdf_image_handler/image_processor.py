from typing import List, Tuple

from pdf_services.pdf_image_handler.image_extractor import ImageExtractor
from pdf_services.pdf_image_handler.image_summarizer import ImageSummarizer
from PIL import Image


class ImageProcessor:
    def __init__(self):
        pass

    def extract_images(self, pdf_path: str) -> List[Image.Image]:
        """Extract images from the PDF."""
        extractor = ImageExtractor(pdf_path=pdf_path)
        images = extractor.extract_images()
        if images is None or len(images) == 0:
            print(f"No images found in the PDF: {pdf_path}")
            return []
        return images

    def summarize_images(self, images: List[str]) -> Tuple[List[str], List[str]]:
        """Summarize the extracted images."""
        if not images:
            return [], []
        summarizer = ImageSummarizer()
        return summarizer.summarize_images(images)
