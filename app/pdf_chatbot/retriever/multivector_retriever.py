import math
import numpy as np
from datetime import datetime
from typing import Dict, List

from sklearn.metrics.pairwise import cosine_similarity
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings


class MultiVectorRetriever:
    """MultiVectorRetriever class to handle retrieval operations."""
    def __init__(
        self,
        model_name="text-embedding-3-large",
        collection_name="multi_modal_rag",
        persist_directory="data/pdf_embeddings",
        filters=None,
    ):
        self.embedding_model = OpenAIEmbeddings(model=model_name)
        self.vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=self.embedding_model,
            persist_directory=persist_directory,
        )
        self.filters = filters
        self.retriever = self.retrieve_retriever(filters=self.filters)
    
    
    def retrieve_retriever(self, filters=None):
        """Return the retriever based on the filters."""
        if not filters:
            # If no filters are provided, return the default retriever
            return self.vectorstore.as_retriever(
                search_type="similarity", search_kwargs={"k": 1}
            )
            
        filter_condition = {}
        
        # Handle the 'year' filter
        if "year" in filters:
            filter_condition = {"year": filters["year"]}

        # Handle the 'yearRange' filter
        elif "yearRange" in filters:
            start_year = filters["yearRange"].get("startYear")
            end_year = filters["yearRange"].get("endYear")
            if start_year and end_year:
                filter_condition = {
                    "$and": [
                        {"year": {"$gte": int(start_year)}},
                        {"year": {"$lte": int(end_year)}}
                    ]
                }

        # Handle the 'X pastYears' filter
        elif "pastYears" in filters:
            past_year = int(filters["pastYears"])
            current_year = datetime.now().year
            start_year = current_year - past_year + 1
            filter_condition = {
                "$and": [
                    {"year": {"$gte": start_year}},
                    {"year": {"$lte": current_year}}
                ]
            }

        return self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 10, "filter": filter_condition}
        )
    
    def re_rank_docs_based_on_recency(self, docs, alpha=0, lambda_=0.01):
        """Re-rank the search results based on the similarity score and time decay."""
        def compute_time_weight(chunk_year, current_year=None):
            if current_year is None:
                current_year = datetime.now().year
            age = current_year - chunk_year
            return math.exp(-lambda_ * age)
    
        current_year = datetime.now().year
        scored_docs = []
    
        for doc in docs:
            year = doc.metadata.get('year', current_year)
            time_weight = compute_time_weight(year, current_year)
            similarity_score = doc.score if hasattr(doc, 'score') else 1
            final_score = alpha * similarity_score + (1 - alpha) * time_weight
            scored_docs.append((doc, final_score))
    
        scored_docs = sorted(scored_docs, key=lambda x: x[1], reverse=True)
        return scored_docs
    
    def re_rank_chunks_with_response(self, response, chunks):
        """Re-ranking the chunks based on the cosine similarity between the response and the chunk content."""
        response_embedding = self.embedding_model.embed_query(response)
        if self.filters and "alpha" in self.filters:
            chunk_embeddings = self.embedding_model.embed_documents([chunk.page_content for chunk, score in chunks])
        else:   
            chunk_embeddings = self.embedding_model.embed_documents([chunk.page_content for chunk in chunks])
        scores = [
            cosine_similarity([response_embedding], [chunk_embedding])[0][0]
            for chunk_embedding in chunk_embeddings
        ]
        return sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)

    
    def filter_chunks_for_source(self, top_chunks: List[Dict]) -> List[Dict]:
        """Filters the top chunks based on specific rules."""
        seen_sources = set()
        final_chunks = []

        for i, chunk in enumerate(top_chunks):
            source = chunk["source"]
            score = chunk["score"]

            # Rule 1: Ignore duplicates based on source
            if source in seen_sources:
                continue

            # Rule 2: Include all chunks with score >= 0.80
            if score >= 0.80:
                final_chunks.append(chunk)
                seen_sources.add(source)
                continue

            if score < 0.80:
                # Rule 3: If the first chunk has a score < 0.70, only return the first chunk and skip the rest
                if i == 0 and score < 0.70:
                    final_chunks = [top_chunks[0]]
                    break

                # Rule 4: If the first chunk has a score <0.80, include it and skip other rules
                if i == 0 and score < 0.80:
                    final_chunks.append(chunk)
                    seen_sources.add(source)
                    continue

                # Rule 5: Check the score difference for chunks with lower scores
                if i == 1:  # For the second chunk, compare with the first chunk
                    first_chunk = top_chunks[0]
                    if abs(first_chunk["score"] - score) <= 0.1:
                        final_chunks.append(chunk)
                        seen_sources.add(source)
                        continue

                if i > 0:  # For subsequent chunks, compare with the first chunk
                    first_chunk = top_chunks[0]
                    if abs(first_chunk["score"] - score) <= 0.05:
                        final_chunks.append(chunk)
                        seen_sources.add(source)
                    else:
                        continue
        return final_chunks
