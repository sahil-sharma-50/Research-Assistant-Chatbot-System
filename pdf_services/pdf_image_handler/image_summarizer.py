import base64
import io
from typing import List, Tuple

from pdf_services.config.settings import Config
from langchain.messages import HumanMessage
from langchain_openai import ChatOpenAI
from PIL import Image
from tqdm import tqdm


class ImageSummarizer:
    def __init__(self):
        self.chat = ChatOpenAI(model=Config.MODEL, max_tokens=2000)

    def image_summarize(self, img_base64: str, prompt: str) -> str:
        """Summarize an image based on its base64 encoding."""
        msg = self.chat.invoke(
            [
                HumanMessage(
                    content=[
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{img_base64}"},
                        },
                    ]
                )
            ]
        )
        return msg.content

    def summarize_images(
        self, images: List[Image.Image]
    ) -> Tuple[List[str], List[str]]:
        """Generate summaries for a list of images."""
        img_base64_list = []
        image_summaries = []

        prompt = """
        Analyze the provided image and focus on each distinct element (table, figure, diagram) individually.
        For each element, provide a comprehensive explanation covering the following aspects:

        1. **Table Analysis**:
            - Title: Identify and explain the title of the table.
            - Headers: Describe the headers and what each column represents.
            - Data: Summarize the data presented in the table and highlight any significant figures or patterns.
            - Footnotes: Explain any footnotes or additional information provided.

        2. **Diagram/Figure Analysis**:
            - Title/Caption: Identify and explain the title or caption of the diagram/figure.
            - Components: Describe all components, symbols, colors, and their relationships.
            - Flow/Process: Explain any sequences or processes indicated by arrows or lines.
            - Legends/Keys: Interpret the legend or key used in the figure.
            - Main Focus: Discuss the main focus or purpose of the figure and any notable details.

        3. **Image Context**:
            - Text Placement: Identify where the text is located in relation to the image and its relevance.
            - Overall Description: Provide an overall description of the image, combining the information from all elements.
    
        Ensure each element is explained separately and in detail. If multiple elements share a common theme or are interrelated, describe their connections.
        """

        for image in tqdm(images, desc="Summarizing Images"):
            try:
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
                img_base64_list.append(img_base64)
                image_summaries.append(self.image_summarize(img_base64, prompt))
            except Exception as e:
                pass
        return img_base64_list, image_summaries
