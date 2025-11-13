from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict, Any, Optional
from ..core.config import settings
import time

class PineconeService:
    def __init__(self):
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.dimension = settings.EMBEDDING_DIMENSION
        self._ensure_index_exists()

    def _ensure_index_exists(self):
        try:
            if self.index_name not in self.pc.list_indexes().names():
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT
                    )
                )
                time.sleep(5)
            self.index = self.pc.Index(self.index_name)
        except Exception as e:
            raise Exception(f"Failed to initialize Pinecone index: {str(e)}")

    async def upsert_document(
        self,
        doc_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        metadata: Dict[str, Any]
    ) -> bool:
        try:
            vectors = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{doc_id}_chunk_{i}"
                vector_metadata = {
                    **metadata,
                    "chunk_index": i,
                    "text": chunk[:1000]
                }
                vectors.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": vector_metadata
                })

            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                self.index.upsert(vectors=batch)

            return True
        except Exception as e:
            raise Exception(f"Failed to upsert document to Pinecone: {str(e)}")

    async def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        try:
            query_params = {
                "vector": query_embedding,
                "top_k": top_k,
                "include_metadata": True
            }
            if filter_dict:
                query_params["filter"] = filter_dict

            results = self.index.query(**query_params)

            matches = []
            for match in results.matches:
                matches.append({
                    "id": match.id,
                    "score": match.score,
                    "text": match.metadata.get("text", ""),
                    "metadata": match.metadata
                })

            return matches
        except Exception as e:
            raise Exception(f"Failed to search in Pinecone: {str(e)}")

    async def delete_document(self, doc_id: str) -> bool:
        try:
            self.index.delete(filter={"doc_id": doc_id})
            return True
        except Exception as e:
            raise Exception(f"Failed to delete document from Pinecone: {str(e)}")

    async def get_index_stats(self) -> Dict[str, Any]:
        try:
            stats = self.index.describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension
            }
        except Exception as e:
            raise Exception(f"Failed to get index stats: {str(e)}")

pinecone_service = PineconeService()
