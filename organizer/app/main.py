import asyncio
import os
import shutil
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pydantic import BaseModel
from typing import List, Optional

from agent.graph import crypto_agent

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

scheduler = AsyncIOScheduler()


async def job_monitoramento_mercado():
    print("\n[WORKER] Agente acordando para analisar o mercado...")
    initial_state = {
        "symbol": "BTC/USDT",
        "timeframe": "1h",
        "messages": [],
        "signals": [],
    }
    try:
        result = await crypto_agent.ainvoke(initial_state)
        print(f"[WORKER] Motivo: {result.get('reasoning', '')[:200]}")
    except Exception as e:
        print(f"[WORKER] Erro: {e}")
    print("[WORKER] Análise concluída.\n")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(">>> Iniciando o Motor do Agente...")
    scheduler.add_job(job_monitoramento_mercado, "interval", minutes=15)
    scheduler.start()
    yield
    print(">>> Desligando o Agente de forma segura...")
    scheduler.shutdown()


app = FastAPI(title="Lux Crypto Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Modelos ────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    symbol: Optional[str] = "BTC/USDT"
    history: Optional[List[ChatMessage]] = []


# ─── Rotas ──────────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat_with_agent(req: ChatRequest):
    print(f"\n[API] Chat: {req.message}")
    initial_state = {
        "symbol": req.symbol,
        "timeframe": "1h",
        "messages": [{"role": "user", "content": req.message}],
        "signals": [],
    }
    try:
        result = await crypto_agent.ainvoke(initial_state)
        return {
            "status": "success",
            "response": result.get("reasoning", "Sem resposta do modelo."),
            "state": result,
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }


@app.post("/analyze-csv")
async def analyze_csv(
    file: UploadFile = File(...),
    symbol: str = Form(default="UNKNOWN"),
    message: str = Form(default="Analise este gráfico e me dê sua interpretação técnica."),
):
    """
    Recebe um CSV do TradingView, salva em data/ e roda a análise completa.
    O arquivo fica disponível para o scheduler reutilizar como CSV monitorado.
    """
    print(f"\n[API] CSV recebido: {file.filename} | símbolo: {symbol}")

    # Salva o arquivo em data/ com nome padronizado
    safe_name = file.filename.replace(" ", "_")
    dest_path = os.path.join(DATA_DIR, safe_name)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    initial_state = {
        "symbol": symbol,
        "timeframe": "csv",
        "csv_path": dest_path,
        "messages": [{"role": "user", "content": message}],
        "signals": [],
    }

    try:
        result = await crypto_agent.ainvoke(initial_state)
        return {
            "status": "success",
            "response": result.get("reasoning", "Sem resposta do modelo."),
            "indicators": {
                "price": result.get("latest_price"),
                "rsi": result.get("rsi"),
                "signals": result.get("signals"),
            },
            "state": result,
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }


@app.get("/status")
async def ver_saude_do_agente():
    csvs = os.listdir(DATA_DIR) if os.path.exists(DATA_DIR) else []
    return {
        "status": "Agente Ativo",
        "vigiando": ["BTC", "ETH"],
        "csvs_em_data": csvs,
    }


if __name__ == "__main__":
    print("Iniciando o servidor Uvicorn...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
