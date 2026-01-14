"""
images_extractor.py

This module extracts images and corresponding pages as images
from PDFs and returns them for further steps.
"""

import os
from typing import List, Tuple

import cv2
import fitz
import numpy as np
from pdf_services.config.settings import Config
from pdf2image import convert_from_path
from PIL import Image
from tqdm import tqdm

class ImageExtractor:
    def __init__(
        self,
        pdf_path: str,
        dpi: int = Config.DPI,
        left_margin: int = Config.LEFT_MARGIN,
        right_margin: int = Config.RIGHT_MARGIN,
        top_margin: int = Config.TOP_MARGIN,
        bottom_margin: int = Config.BOTTOM_MARGIN,
        min_width_pixels: int = Config.MIN_WIDTH_PIXELS,
        min_height_pixels: int = Config.MIN_HEIGHT_PIXELS,
    ):
        self.pdf_path = pdf_path
        self.dpi = dpi
        self.left_margin = left_margin
        self.right_margin = right_margin
        self.top_margin = top_margin
        self.bottom_margin = bottom_margin
        self.min_width_pixels = min_width_pixels
        self.min_height_pixels = min_height_pixels
        self.scale_factor = Config.SCALE_FACTOR
        self.pixels_per_point = Config.PIXELS_PER_POINT
        self.threshold = Config.THRESHOLD

    def extract_images_from_pdf(self) -> List[Image.Image]:
        """
        Convert each page of the PDF into an image.
        """
        return convert_from_path(self.pdf_path, dpi=self.dpi)

    def rects_overlap(
        self,
        rect1: Tuple[float, float, float, float],
        rect2: Tuple[float, float, float, float],
    ) -> bool:
        """
        Check if two rectangles overlap.
        """
        return not (
            rect1[2] < rect2[0]
            or rect1[0] > rect2[2]
            or rect1[3] < rect2[1]
            or rect1[1] > rect2[3]
        )

    def combine_overlapping_rects(
        self, rects: List[Tuple[float, float, float, float]]
    ) -> List[Tuple[float, float, float, float]]:
        """
        Combine overlapping rectangles into larger ones to avoid sub-images.
        """
        if not rects:
            return []
        # Sort rectangles by area (largest first)
        rects = sorted(rects, key=lambda r: (r[2] - r[0]) * (r[3] - r[1]), reverse=True)
        combined_rects = []
        while rects:
            # Start with the largest rect
            current_rect = rects.pop(0)
            has_merged = False
            # Compare current rectangle with each already combined rectangle
            for i in range(len(combined_rects)):
                existing_rect = combined_rects[i]
                if self.rects_overlap(existing_rect, current_rect):
                    # Merge by expanding the existing rectangle to cover the current one
                    new_combined = (
                        min(existing_rect[0], current_rect[0]),
                        min(existing_rect[1], current_rect[1]),
                        max(existing_rect[2], current_rect[2]),
                        max(existing_rect[3], current_rect[3]),
                    )
                    # Update the existing combined rectangle
                    combined_rects[i] = new_combined
                    has_merged = True
                    # Re-check for further merging with other combined rectangles
                    # to ensure all possible overlaps are handled
                    for j in range(len(combined_rects)):
                        if j != i and self.rects_overlap(
                            combined_rects[j], new_combined
                        ):
                            # Merge the newly combined rectangle with another one
                            combined_rects[j] = (
                                min(combined_rects[j][0], new_combined[0]),
                                min(combined_rects[j][1], new_combined[1]),
                                max(combined_rects[j][2], new_combined[2]),
                                max(combined_rects[j][3], new_combined[3]),
                            )
                            # Remove the old combined rectangle
                            combined_rects.pop(i)
                            break
                    break
            # If no overlap found, add current rectangle as is
            if not has_merged:
                combined_rects.append(current_rect)
        return combined_rects

    def detect_figures_from_contours(
        self, image: np.ndarray
    ) -> List[Tuple[int, int, int, int]]:
        """
        Detect figures using contours in an image.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, self.threshold, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(
            thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        detected_figures = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / float(h)
            area = w * h
            if (
                (0.2 < aspect_ratio < 5)
                and (area > 10000)
                and (w >= self.min_width_pixels)
                and (h >= self.min_height_pixels)
            ):
                x_margin = max(0, x - self.left_margin)
                y_margin = max(0, y - self.top_margin)
                w_margin = min(
                    image.shape[1] - x_margin, w + self.left_margin + self.right_margin
                )
                h_margin = min(
                    image.shape[0] - y_margin, h + self.top_margin + self.bottom_margin
                )

                detected_figures.append(
                    (x_margin, y_margin, x_margin + w_margin, y_margin + h_margin)
                )

        return detected_figures

    def extract_drawings_and_images_from_page(
        self, page, pixels_per_point
    ) -> List[Tuple[float, float, float, float]]:
        """
        Extract drawings and images from a PDF page using PyMuPDF.
        """
        extracted_drawings = page.get_drawings()
        extracted_images = page.get_images(full=True)

        image_rects = []

        # Extract drawings
        for drawing in extracted_drawings:
            rect = drawing["rect"]
            bbox = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y1)
            if (
                bbox.width * pixels_per_point >= self.min_width_pixels
                and bbox.height * pixels_per_point >= self.min_height_pixels
            ):
                image_rects.append(
                    (
                        bbox.x0 * pixels_per_point,
                        bbox.y0 * pixels_per_point,
                        bbox.x1 * pixels_per_point,
                        bbox.y1 * pixels_per_point,
                    )
                )

        # Extract images
        for _, img in enumerate(extracted_images):
            xref = img[0]
            img_rects = list(page.get_image_rects(xref))
            for rect in img_rects:
                if (
                    rect.width * pixels_per_point >= self.min_width_pixels
                    and rect.height * pixels_per_point >= self.min_height_pixels
                ):
                    image_rects.append(
                        (
                            rect.x0 * pixels_per_point,
                            rect.y0 * pixels_per_point,
                            rect.x1 * pixels_per_point,
                            rect.y1 * pixels_per_point,
                        )
                    )

        return image_rects

    def save_images(
        self, images: List[Image.Image], output_folder: str = Config.OUTPUT_FOLDER
    ) -> None:
        """
        Save extracted images to the specified output folder.
        """
        os.makedirs(output_folder, exist_ok=True)
        for i, img in enumerate(images):
            img_path = os.path.join(output_folder, f"image_{i + 1}.png")
            try:
                img.save(img_path)
                print(f"Saved: {img_path}")
            except Exception as e:
                pass

    def extract_images(self) -> List[Image.Image]:
        """
        Extract images and drawings from a PDF and return them
        as a combined list of full pages and detected images.
        """
        pages = self.extract_images_from_pdf()
        doc = fitz.open(self.pdf_path)
        combined_images = []

        for page_num, page_image in enumerate(tqdm(pages, desc="Extracting Images")):
            page = doc.load_page(page_num)
            image = cv2.cvtColor(np.array(page_image), cv2.COLOR_RGB2BGR)

            # Detect figures in the page using contours
            detected_figures = self.detect_figures_from_contours(image)

            # Extract drawings and images from the PDF page
            image_rects = self.extract_drawings_and_images_from_page(
                page, self.pixels_per_point
            )

            # Combine all detected rectangles
            all_rects = detected_figures + image_rects
            combined_rects = self.combine_overlapping_rects(all_rects)

            if not combined_rects:
                continue  # Skip pages without detected images

            # Append detected images to the combined list
            for rect in combined_rects:
                x0, y0, x1, y1 = rect
                if rect in detected_figures:
                    figure = image[int(y0) : int(y1), int(x0) : int(x1)]
                    combined_images.append(
                        Image.fromarray(cv2.cvtColor(figure, cv2.COLOR_BGR2RGB))
                    )
                else:
                    bbox = fitz.Rect(
                        x0 / self.pixels_per_point,
                        y0 / self.pixels_per_point,
                        x1 / self.pixels_per_point,
                        y1 / self.pixels_per_point,
                    )
                    pix = page.get_pixmap(
                        matrix=fitz.Matrix(self.scale_factor, self.scale_factor),
                        clip=bbox,
                    )
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    combined_images.append(img)

        return combined_images


# Usuage
# Initialize the extractor with a PDF path
# extractor = ImageExtractor(pdf_path="path_to_pdf.pdf")
# Extract images
# images = extractor.extract_images()
# Save the images to the specified folder
# extractor.save_images(images)
