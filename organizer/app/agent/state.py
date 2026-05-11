from typing import TypedDict, List, Dict, Any, Annotated, Sequence, Optional
import operator

class AgentState(TypedDict):
    """Estado de memória do Agente Cripto no LangGraph."""

    symbol: str
    timeframe: str

    # Dados de Mercado
    latest_price: float
    trend: str
    rsi: Optional[float]
    signals: List[str]
    indicators: Dict[str, Any]   # dict completo de indicadores calculados

    # Contexto Externo
    news_summary: List[str]
    market_sentiment: str

    # RAG & Estratégia
    rag_guidelines: str

    # Raciocínio & Decisão
    messages: Annotated[Sequence[dict], operator.add]
    decision: str       # BUY, SELL, HOLD, WAIT
    confidence: float
    reasoning: str

    # Fonte de dados (None = ccxt | str = caminho do CSV)
    csv_path: Optional[str]

    # Controle de Fluxo
    next_node: str
