from openai import OpenAI
from langchain_core.prompts import ChatPromptTemplate

OPENAI_MODELS = ["4o", "4o-mini", "o1", "o1-mini", "o3-mini"]

class Translator:
    def __init__(self):
        pass
    
    def translate_text(self, text: str, target_language: str, model, model_name) -> str:
        """Translate the text to the target language."""

        template = f"""
        You are a helpful assistant who is an expert in translating any text to
        {'German' if target_language == 'de' else 'English'} for the electric motor production industry.
        
        Translate the following text to {'German' if target_language == 'de' else 'English'}, 
        only return the translation:\n\n{text}"
        """
        
        prompt = ChatPromptTemplate.from_template(template)
        
        chain = prompt | model
        response = chain.invoke({"text": text, "target_language": target_language})
        return response.content
        