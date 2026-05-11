import re
import os
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from .state import AgentState
from .tools import lux_tools

# MODEL_ID = "Chainbase-Labs/Theia-Llama-3.1-8B-v1"
OLLAMA_MODEL = "qwen3:8b-q4_K_M"

# Qwen3 via Ollama: think=False desativa o modo de raciocínio estendido
# para manter respostas rápidas e sem tokens <think>
llm = ChatOllama(
    model=OLLAMA_MODEL,
    temperature=0.1,
    num_ctx=8192,
    options={"think": False},
)


def _clean_response(text: str) -> str:
    """Remove blocos <think>...</think> que podem escapar mesmo com think=False."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _find_latest_csv(data_dir: str, symbol: str) -> str | None:
    """Retorna o CSV mais recente em data/ que corresponda ao símbolo."""
    if not os.path.exists(data_dir):
        return None
    slug = symbol.replace("/", "").replace("-", "").upper()
    candidates = [
        f for f in os.listdir(data_dir)
        if f.lower().endswith(".csv") and slug in f.upper()
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda f: os.path.getmtime(os.path.join(data_dir, f)), reverse=True)
    return os.path.join(data_dir, candidates[0])


def router_node(state: AgentState):
    """
    Decide qual ramo do grafo ativar com base na intenção do usuário.
    Roteamento por palavras-chave — pode ser evoluído para LLM-router em Fase 2.
    """
    print("--- LUX ROUTER: ANALISANDO INTENÇÃO ---")

    messages = state.get("messages", [])
    user_msg = messages[-1]["content"] if messages else ""

    if any(w in user_msg.lower() for w in ["bitcoin", "btc", "eth", "cripto", "chart", "gráfico"]) or not messages:
        return {"next_node": "observation"}
    elif any(w in user_msg.lower() for w in ["estratégia", "livro", "manual", "ir", "imposto", "regra"]):
        return {"next_node": "rag_search"}
    else:
        return {"next_node": "observation"}


def rag_search_node(state: AgentState):
    """Consulta o ChromaDB e injeta o contexto no estado."""
    print("--- BUSCA SEMÂNTICA (CHROMA) ---")

    messages = state.get("messages", [])
    user_msg = messages[-1]["content"] if messages else ""

    from .tools import search_knowledge_base
    context = search_knowledge_base.invoke({"query": user_msg})

    return {"rag_guidelines": context, "next_node": "reflection"}


def observation_node(state: AgentState):
    """
    Coleta dados de mercado.
    Prioridade: CSV (upload/pasta data/) → ccxt (Binance).
    """
    from .tools import get_crypto_price, load_csv_chart

    csv_path = state.get("csv_path")
    symbol = state.get("symbol", "BTC/USDT")

    if csv_path:
        print(f"--- CSV: {csv_path} ---")
        data = load_csv_chart.invoke({"file_path": csv_path, "symbol": symbol})
    else:
        # Verifica se existe CSV recente na pasta data/ para o símbolo
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
        csv_path_auto = _find_latest_csv(data_dir, symbol)
        if csv_path_auto:
            print(f"--- CSV MONITORADO: {csv_path_auto} ---")
            data = load_csv_chart.invoke({"file_path": csv_path_auto, "symbol": symbol})
        else:
            print(f"--- CCXT (Binance): {symbol} ---")
            data = get_crypto_price.invoke({"symbol": symbol})

    ind = data.get("indicators", {})
    return {
        "latest_price": data.get("price", 0),
        "rsi":       ind.get("rsi"),
        "trend":     data.get("trend"),
        "signals":   data.get("signals", []),
        "indicators": ind,
        "next_node": "reflection",
    }


def reflection_node(state: AgentState):
    """Nó de síntese: o LLM (Qwen3 via Ollama) produz a análise final."""
    print(f"--- LUX REFLECTION: SÍNTESE [{OLLAMA_MODEL}] ---")

    messages = state.get("messages", [])
    user_msg = messages[-1]["content"] if messages else "Análise de rotina do mercado."

    # Monta bloco de indicadores formatado
    ind = state.get("indicators") or {}
    def _fmt(val, decimals=2):
        return f"{val:.{decimals}f}" if val is not None else "N/A"

    indicators_block = (
        f"  Preço        : {_fmt(state.get('latest_price'), 2)}\n"
        f"  Tendência    : {state.get('trend', 'N/A')}\n"
        f"  RSI (14)     : {_fmt(ind.get('rsi'))}\n"
        f"  Stoch K/D    : {_fmt(ind.get('stoch_k'))} / {_fmt(ind.get('stoch_d'))}\n"
        f"  MACD         : {_fmt(ind.get('macd'), 4)} | Sinal: {_fmt(ind.get('macd_signal'), 4)} | Hist: {_fmt(ind.get('macd_hist'), 4)}\n"
        f"  EMA  9/20/50 : {_fmt(ind.get('ema_9'))} / {_fmt(ind.get('ema_20'))} / {_fmt(ind.get('ema_50'))}\n"
        f"  EMA 200      : {_fmt(ind.get('ema_200'))}\n"
        f"  BB Upper/Lower: {_fmt(ind.get('bb_upper'))} / {_fmt(ind.get('bb_lower'))} | Width: {_fmt(ind.get('bb_width'))}\n"
        f"  ATR (14)     : {_fmt(ind.get('atr'))}\n"
        f"  ADX (14)     : {_fmt(ind.get('adx'))}\n"
        f"  Volume Ratio : {_fmt(ind.get('vol_ratio'))}x (vs MA20)\n"
        f"  Sinais       : {', '.join(state.get('signals') or []) or 'Nenhum'}"
    )

    system_prompt = (
        "Você é o Lux Investment Co-Pilot, um analista técnico de elite.\n"
        "Recebe dados de mercado completos (indicadores calculados) e diretrizes estratégicas "
        "extraídas da base de conhecimento.\n"
        "Sua análise deve:\n"
        "1. Identificar o contexto de mercado (tendência, momentum, volatilidade).\n"
        "2. Apontar os sinais mais relevantes e o que eles indicam.\n"
        "3. Sugerir zonas de atenção (entrada, stop, alvo) se os critérios estiverem alinhados.\n"
        "4. Ser objetiva, técnica e em português."
    )

    context_block = (
        f"INDICADORES DE MERCADO:\n{indicators_block}\n\n"
        f"DIRETRIZES ESTRATÉGICAS (base de conhecimento):\n"
        f"{state.get('rag_guidelines', 'Nenhuma diretriz encontrada.')}\n\n"
        f"PERGUNTA DO USUÁRIO:\n{user_msg}"
    )

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=context_block),
    ])

    clean = _clean_response(response.content)
    return {"reasoning": clean, "next_node": "output"}


def output_node(state: AgentState):
    print("--- LUX OUTPUT ---")
    return {"next_node": "end"}
