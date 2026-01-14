import json

from typing import Dict, List, Optional, Tuple
from xml.dom.minidom import Document

from annotated_types import doc
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langdetect import detect
from pdf_chatbot.retriever.multivector_retriever import MultiVectorRetriever
from pdf_chatbot.utils.translator import Translator
from pydantic import BaseModel, Field

OPENAI_MODELS = ["4o", "4o-mini", "o1", "o1-mini", "o3-mini"]


class RetrievalPipeline:
    """Encapsulates the RAG pipeline, including model initialization, context retrieval, and response generation."""

    def __init__(
        self,
        model_name: str = "4o",
        model="",
        filters: Optional[Dict] = None,
    ):
        self.model_name = model_name
        self.model = model
        self.filters = filters
        self.retriever_instance = MultiVectorRetriever(filters=filters)
        self.retriever = self.retriever_instance.retriever
        self.re_rank_docs_based_on_recency = (
            self.retriever_instance.re_rank_docs_based_on_recency
        )
        self.filter_chunks_for_source = self.retriever_instance.filter_chunks_for_source
        self.translator = Translator()

    def _rephrase_query(self, query, history):
        """Rephrases user query based on chat history."""
        template = """
        Refine the user query based on the chat history:  

        - If the query is **self-contained** and does not rely on the chat history, return it as is.  
        - If the query depends on the chat history, rephrase it into a clear and standalone question.  
        - Only rephrase when necessary. Return the query without changes if it is already standalone.
        - Respond only with the query without any additional comments or explanations.  

        ### Input:  
        Chat History: {chat_history}  
        User Query: {query}  

        ### Output:  
        Refined Query:
        """

        rephrase_prompt = ChatPromptTemplate.from_template(template)
        prompt_input = rephrase_prompt.format(query=query, chat_history=history)
        rephrase_chain = rephrase_prompt | self.model
        rephrased_query = rephrase_chain.invoke(
            {"query": query, "chat_history": history}
        )
        return "ok", rephrased_query.content

    def _generate_multi_queries(self, question):
        """Generates multiple variations of a query for retrieval."""
        template = """
        Your task is to generate one different version of the given user question for better vector store retrieval.
        Provide exactly one alternative query, separated by newlines, without any additional comments or explanations.
        
        ### Input:
        User Question: {question}

        ### Output:
        """

        multi_query_prompt = ChatPromptTemplate.from_template(template)
        prompt_input = multi_query_prompt.format(question=question)
        chain = multi_query_prompt | self.model
        output = chain.invoke({"question": question})
        return "ok", output.content.split("\n")

    def get_unique_union(self, documents):
        """Returns a unique union of retrieved documents."""
        flattened_docs = [doc for sublist in documents for doc in sublist]
    
        seen_contents = set()
        unique_docs = []
    
        for doc in flattened_docs:
            # Access attribute using dot notation, not .get()
            content = doc.page_content 
        
            if content not in seen_contents:
                seen_contents.add(content)
                unique_docs.append(doc)
            
        return unique_docs
        

    def _construct_rag_chain(self, question, context):
        """Constructs a RAG chain response based on context and question."""
        template = """
        Answer the following question based on the provided context.
        Don't include any references to the question or the context in the response.
        Keep the answer relevant to the question and the context.
        Do not include any information outside of the given context.
        
        ### Input:
        Context: {context}
        Question: {question}
        """

        answer_prompt = ChatPromptTemplate.from_template(template)
        prompt_input = answer_prompt.format(question=question, context=context)

        chain = answer_prompt | self.model
        response = chain.invoke({"context": context, "question": question})
        return "ok", response.content

    def _check_response(self, question, response):
        """Check if the response is a valid answer."""

        template = """ 
        Check if the response provides an answer or at least some relevant information related to the question.
        Return 'True' if the response is related and provides some answer to the question, otherwise return 'False'.
        Don't provide any additional information or context. Only return 'True' or 'False'.
        
        Take these two examples as a reference:
        ###Sample for 'True' Output:
        1. The context does not provide a direct answer to the question of how process-secure the layer-wise twisting is. 
        However, it can be inferred that layer-wise twisting is considered a viable method for twisting hairpins, 
        and it is mentioned alongside simultaneous twisting of all layers as an alternative to twisting single wires.
        
        2. The context does not provide a direct comparison between resistance soldering and resistance pressure welding in terms of electrical properties. 
        However, it does mention that laser welding, a different process, shows potential for achieving good electrical properties comparable to the base material. 
        For a specific comparison between resistance soldering and resistance pressure welding, additional information would be needed.
        
        
        ###Sample for 'False' Output:
        1. The context provided does not contain any information about "Luffy." 
        Therefore, I cannot answer the question based on the given context. 
        If you have more specific information or a different context, please provide it for a more accurate response.
        
        2. The context given lacks details regarding 'some technique'. As such, I cannot generate a meaningful response based on this information. 
        Please share more specific details or a new context for a more accurate answer.
        
        
        ### Input:
        Question: {question}
        Context: {response}
        """

        check_answer_prompt = ChatPromptTemplate.from_template(template)
        prompt_input = check_answer_prompt.format(question=question, response=response)

        chain = check_answer_prompt | self.model
        is_answered = chain.invoke({"question": question, "response": response})

        if "False" in is_answered.content:
            return False
        else:
            return True

    def retrieve_docs(self, queries):
        retrieved_docs = [self.retriever.invoke(query) for query in queries]
        unique_docs = self.get_unique_union(retrieved_docs)

        if self.filters and "alpha" in self.filters:
            unique_docs = self.re_rank_docs_based_on_recency(
                unique_docs, alpha=self.filters["alpha"]
            )

        return unique_docs

    def get_response(self, user_query: str, history: List[str]):
        """Handles the full flow: rephrase query, generate multi-queries, retrieve documents, and generate final response."""
        # Step 1: Rephrase query based on history
        # Get the last two messages from the history
        if history:
            history = history[-2:]
            status, rephrased_query = self._rephrase_query(user_query, history)
            if status == "violation":
                return rephrased_query, ""
        else:
            rephrased_query = user_query

        # Step 2: Generate alternative queries
        target_language = "de" if detect(user_query) == "en" else "en"
        translated_query = self.translator.translate_text(
            rephrased_query, target_language, self.model, self.model_name
        )
        alternative_queries = [rephrased_query, translated_query]

        status, generated_queries = self._generate_multi_queries(rephrased_query)
        generated_queries = [query for query in generated_queries if query.strip()]
        generated_queries = [q.rstrip() for q in generated_queries]

        if status == "violation":
            return generated_queries, ""
        alternative_queries.extend(generated_queries)

        # Step 3: Retrieve documents
        unique_docs = self.retrieve_docs(alternative_queries)

        # Step 4: Construct RAG response
        status, response = self._construct_rag_chain(rephrased_query, unique_docs)
        if status == "violation":
            return response, ""

        have_response = self._check_response(rephrased_query, response)

        if not have_response:
            return "No-Response", ""

        # Step 5: Retrieve Sources for the Generated Response
        re_ranked_chunks = self.retriever_instance.re_rank_chunks_with_response(
            response, unique_docs
        )

        # Get metadata of the top chunks
        if self.filters and "alpha" in self.filters:
            top_chunks_metadata = [
                {"source": chunk[0].metadata.get("source", "Unknown"), "score": score}
                for chunk, score in re_ranked_chunks
            ]
        else:
            top_chunks_metadata = [
                {"source": chunk.metadata.get("source", "Unknown"), "score": score}
                for chunk, score in re_ranked_chunks
            ]

        final_chunks = self.filter_chunks_for_source(top_chunks_metadata)
        return response, final_chunks
