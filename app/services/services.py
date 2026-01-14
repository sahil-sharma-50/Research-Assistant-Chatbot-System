"""Module covering the services of the Chatbot"""
import sys
import warnings
from os.path import abspath, dirname, realpath

PATH = realpath(abspath(__file__))
sys.path.insert(0, dirname(PATH))
sys.path.insert(0, dirname(dirname(PATH)))

import logging

from pdf_services.scholar_article_handler.scholar_data_retriever import ScholarDataRetriever
from models.query import Query
from pdf_chatbot.core.query.query_handler import PDFQuery
from pdf_chatbot.core.query.query_handler import QueryHandler
from pdf_services.scholar_article_handler.scholar_data_retriever import (
    ScholarDataRetriever,
)
from pdf_chatbot.core.conversation.conversation_manager import ConversationManager
from pdf_chatbot.core.services.pdf_core_services import PdfCoreServices

logging = logging.getLogger(__name__)

OPENAI_MODELS = ["4o", "4o-mini", "o1", "o1-mini", "o3-mini"]

class Services:
    """
    Service class containing all the functionalities
    """
    def __init__(self) -> None:
        warnings.filterwarnings("ignore", category=DeprecationWarning)
        self.scholar_retriever = ScholarDataRetriever()
        self.query_handler = QueryHandler()
        self.chat_history = ConversationManager()
        self.pdf_core_services = PdfCoreServices()

    def reset_conversation(self, session_id: str):
        """
        Reset the current conversation

        Args:
            session_id: the conversation ID
        """
        self.query_handler.reset_conversation(session_id)

    def query_pdf_answer(self, query: PDFQuery, session_id: str, llm_model: str):
        response = self.query_handler.handle_query(
            user_query=query.query, filters=query.filters, session_id=session_id, history=self.chat_history.get_history(), llm_model=llm_model
        )
        return response
    
    def download_pdf_from_scholar(self, query: Query):
        return self.scholar_retriever.download_pdf(query=query.query, num_pdf=query.num_pdf, source=query.source)

    def upload_scholar_pdf(self):
        return self.scholar_retriever.ingest_scholar_pdf()
    