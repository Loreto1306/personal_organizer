"""
Ingestão de documentos no ChromaDB (BGE-M3).

Estrutura esperada em organizer/app/documents/:
  documents/
  ├── crypto/        → livros e análises de criptoativos
  ├── strategy/      → manuais de trading, price action, setup
  ├── stocks/        → análise fundamentalista, FIIs, renda variável
  ├── macro/         → economia, juros, cenário macro
  └── tax/           → IR, declaração, regras tributárias

Uso:
  python ingest_knowledge.py          # processa todos os PDFs novos
  python ingest_knowledge.py --reset  # limpa o banco e reindexa tudo
"""

import os
import sys
import argparse
import shutil
import logging

logging.basicConfig(level=logging.WARNING)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent.knowledge_base import KnowledgeBase

DOCUMENTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "documents")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agent", "db", "chroma")

VALID_CATEGORIES = {"crypto", "strategy", "stocks", "macro", "tax"}


def reset_database():
    if os.path.exists(CHROMA_DIR):
        shutil.rmtree(CHROMA_DIR)
        print("✓ Banco vetorial apagado.")
    os.makedirs(CHROMA_DIR, exist_ok=True)


def scan_documents():
    """Retorna lista de (file_path, category) para todos os PDFs em documents/."""
    found = []

    if not os.path.exists(DOCUMENTS_DIR):
        print(f"✗ Pasta não encontrada: {DOCUMENTS_DIR}")
        return found

    for entry in os.scandir(DOCUMENTS_DIR):
        if entry.is_dir() and entry.name in VALID_CATEGORIES:
            category = entry.name
            for fname in os.listdir(entry.path):
                if fname.lower().endswith(".pdf"):
                    found.append((os.path.join(entry.path, fname), category))

        elif entry.is_file() and entry.name.lower().endswith(".pdf"):
            # PDFs soltos na raiz de documents/ vão para "strategy" por padrão
            found.append((entry.path, "strategy"))

    return found


def run(reset: bool = False):
    if reset:
        reset_database()

    print("\n=== LUX KNOWLEDGE INGEST ===")
    print(f"Pasta: {DOCUMENTS_DIR}\n")

    docs = scan_documents()
    if not docs:
        print("Nenhum PDF encontrado. Coloque arquivos em documents/<categoria>/")
        print(f"Categorias válidas: {', '.join(sorted(VALID_CATEGORIES))}")
        return

    print(f"PDFs encontrados: {len(docs)}")
    for path, cat in docs:
        print(f"  [{cat:10s}] {os.path.basename(path)}")

    print("\nCarregando modelo de embeddings (BGE-M3)...")
    kb = KnowledgeBase()

    chunks_antes = kb.count()
    print(f"Chunks no banco antes: {chunks_antes}\n")

    ok = 0
    fail = 0
    for path, category in docs:
        name = os.path.basename(path)
        print(f"  Indexando: {name} [{category}] ...", end=" ", flush=True)
        if kb.ingest_pdf(path, category):
            print("✓")
            ok += 1
        else:
            print("✗ erro")
            fail += 1

    chunks_depois = kb.count()
    novos = chunks_depois - chunks_antes

    print(f"\n{'='*40}")
    print(f"Concluído: {ok} PDFs indexados, {fail} com erro")
    print(f"Chunks adicionados: +{novos}  (total: {chunks_depois})")
    print(f"{'='*40}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingestão de PDFs no ChromaDB")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Apaga o banco e reindexa tudo do zero",
    )
    args = parser.parse_args()
    run(reset=args.reset)
