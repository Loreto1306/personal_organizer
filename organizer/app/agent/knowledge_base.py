import os
import logging
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader

logger = logging.getLogger("KnowledgeBase")

# BGE-M3: multilingual (PT-BR incluído), dense + sparse retrieval
# ~1.2 GB de download na primeira vez; fica em cache do HuggingFace local.
EMBEDDING_MODEL = "BAAI/bge-m3"


class KnowledgeBase:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cuda"},   # usa a GPU; troque por "cpu" se quiser liberar VRAM
            encode_kwargs={"normalize_embeddings": True},
        )

        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.persist_directory = os.path.join(base_dir, "db/chroma")
        os.makedirs(self.persist_directory, exist_ok=True)

        self.vector_db = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="lux_knowledge_base",
        )

        # chunk_size de 800 equilibra custo de embedding e contexto por trecho
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150,
            add_start_index=True,
        )

    def ingest_pdf(self, file_path: str, category: str) -> bool:
        """Carrega, fragmenta e indexa um PDF."""
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            chunks = self.text_splitter.split_documents(pages)
            for chunk in chunks:
                chunk.metadata["category"] = category
                chunk.metadata["source"] = os.path.basename(file_path)
            self.vector_db.add_documents(chunks)
            logger.info(f"Sucesso: {len(chunks)} chunks indexados de '{file_path}'")
            return True
        except Exception as e:
            logger.error(f"Erro ao indexar PDF '{file_path}': {e}")
            return False

    def ingest_text(self, text: str, category: str, source_name: str = "manual") -> bool:
        """Indexa um bloco de texto puro ou manual."""
        try:
            chunks = self.text_splitter.create_documents(
                texts=[text],
                metadatas=[{"category": category, "source": source_name}],
            )
            self.vector_db.add_documents(chunks)
            logger.info(f"Sucesso: {len(chunks)} chunks indexados de '{source_name}'")
            return True
        except Exception as e:
            logger.error(f"Erro ao indexar texto '{source_name}': {e}")
            return False

    def ingest_directory(self, folder_path: str, category: str) -> int:
        """Ingere todos os PDFs de uma pasta de uma vez."""
        total = 0
        for filename in os.listdir(folder_path):
            if filename.lower().endswith(".pdf"):
                full_path = os.path.join(folder_path, filename)
                if self.ingest_pdf(full_path, category):
                    total += 1
        logger.info(f"Ingestão de pasta concluída: {total} PDFs indexados.")
        return total

    def search(self, query: str, category: str = None, k: int = 5) -> str:
        """Busca semântica com filtro opcional de categoria."""
        try:
            search_kwargs = {}
            if category:
                search_kwargs["filter"] = {"category": category}
            results = self.vector_db.similarity_search(query, k=k, **search_kwargs)
            if not results:
                return "Nenhuma informação relevante encontrada na base de conhecimento."
            context = "\n---\n".join(
                f"[Fonte: {doc.metadata.get('source', 'Desconhecida')}]\n{doc.page_content}"
                for doc in results
            )
            return context
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return "Nenhuma informação relevante encontrada na base de conhecimento."

    def count(self) -> int:
        """Retorna o número de chunks indexados."""
        return self.vector_db._collection.count()
