"""The Pydantic Model of the user query."""

from pydantic import BaseModel
from typing import Optional, List


class Query(BaseModel):
    question: str
    num_pdf: Optional[int] = None
    chat_history: Optional[List] = None
    resume_kg: bool = False
    resume_article: bool = False
    page_title: Optional[str] = None
