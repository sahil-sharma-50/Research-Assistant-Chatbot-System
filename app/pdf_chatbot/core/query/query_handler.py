import os
import re
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from langdetect import detect
from langchain_openai import ChatOpenAI

from pdf_chatbot.core.conversation.conversation_manager import ConversationManager
from pdf_chatbot.retriever.retrieval_pipeline import RetrievalPipeline
from pdf_chatbot.utils.translator import Translator

class PDFQuery(BaseModel):
    """Query for a PDF document."""
    query: str
    num_pdf: Optional[int] = None
    source: Optional[str] = None
    chat_history: Optional[List] = None
    filters: Optional[dict] = Field(default=None, description="Additional query filters")


class QueryHandler:
    """Handles the processing of user queries and responses."""
    def __init__(self):
        self.sessions = {}
        self.llms = {
            "4o": ChatOpenAI(model_name="gpt-4o", temperature=0.0),
            "4o-mini": ChatOpenAI(model_name="gpt-4o-mini", temperature=0.0),
            "o1": ChatOpenAI(model_name="o1-preview"),
            "o1-mini": ChatOpenAI(model_name="o1-mini"),
            "o3-mini":ChatOpenAI(model_name="o3-mini", temperature=1),
        }
        self.translator = Translator()
        
    def get_session_history(self, session_id: str) -> ConversationManager:
        """Retrieve or create a new ConversationManager for the session."""
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationManager()
        return self.sessions[session_id]

    def reset_conversation(self, session_id: str):
        """Clear the conversation history for a specific session."""
        if session_id in self.sessions:
            self.sessions[session_id].clear_history()

    def handle_query(self, user_query: str, filters: Optional[dict], session_id: str, history=[], llm_model: str = "4o") -> tuple:
        """Handle the user query and return the response."""
        conversation_manager = self.get_session_history(session_id)
        session_history = conversation_manager.get_history()
        
        model = self.llms.get(llm_model, "4o")
        self.rag_pipeline = RetrievalPipeline(model_name=llm_model, model=model, filters=filters)
        response, source = self.rag_pipeline.get_response(user_query, session_history)
        
        if response == "No-Response":
            return {
            "answer": response,
            "source": "No source details available."
        }
        
        target_language = detect(user_query)
        is_no_response = re.fullmatch(
            r"no-response\.?", response.strip(), re.IGNORECASE
        )
        if detect(response) != target_language and not is_no_response:
            response = self.translator.translate_text(response, target_language, model, llm_model)
        
        conversation_manager.add_to_history(user_query=user_query, response=response)
        return self._format_source_details(response, source)


    def _format_source_details(self, response: str, sources: List[Dict]) -> dict:
        """Formats the response and associated source details."""
        top_sources = sources[:3]
        if not top_sources:
            source_details = "No source details available."
        else:
            source_details = " | ".join(
               os.path.basename(source["source"].replace("\\", "/")) for source in top_sources
            )
        return {
            "answer": response,
            "source": source_details,
        }
    
