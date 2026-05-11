import ccxt
import pandas as pd
import pandas_ta as ta
import logging
import requests
import os
from datetime import datetime
from langchain.tools import tool
from .knowledge_base import KnowledgeBase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LuxTools")

kb = KnowledgeBase()


# ─── Motor de indicadores (compartilhado entre ccxt e CSV) ──────────────────

def _safe_float(val) -> float | None:
    """Converte para float; retorna None se NaN, None ou inválido."""
    try:
        if val is None:
            return None
        f = float(val)
        return None if pd.isna(f) else f
    except (TypeError, ValueError):
        return None


def _calculate_indicators(df: pd.DataFrame, symbol: str) -> dict:
    """
    Recebe um DataFrame OHLCV normalizado e retorna um dict rico de indicadores.
    Cada indicador é calculado de forma independente — falhas individuais não
    interrompem os demais.
    """
    if len(df) < 50:
        return {"status": "error", "message": f"Poucos candles ({len(df)}). Mínimo: 50."}

    close_series  = df["close"].astype(float)
    high_series   = df["high"].astype(float)
    low_series    = df["low"].astype(float)

    # ── Tendência ──────────────────────────────────────────────────────────
    for length, col in [(9, "ema_9"), (20, "ema_20"), (50, "ema_50"), (200, "ema_200")]:
        try:
            df[col] = ta.ema(close_series, length=length)
        except Exception as e:
            logger.warning(f"EMA {length} falhou: {e}")

    # ── Momentum ───────────────────────────────────────────────────────────
    try:
        df["rsi"] = ta.rsi(close_series, length=14)
    except Exception as e:
        logger.warning(f"RSI falhou: {e}")

    try:
        stoch = ta.stochrsi(close_series, length=14)
        if stoch is not None and len(stoch.columns) >= 2:
            df["stoch_k"] = stoch.iloc[:, 0]
            df["stoch_d"] = stoch.iloc[:, 1]
    except Exception as e:
        logger.warning(f"Stoch RSI falhou: {e}")

    # ── MACD ───────────────────────────────────────────────────────────────
    try:
        macd_df = ta.macd(close_series, fast=12, slow=26, signal=9)
        if macd_df is not None:
            cols = macd_df.columns.tolist()
            # aceita qualquer ordem de colunas: MACD, Signal, Hist
            macd_cols = [c for c in cols if c.startswith("MACD_")]
            sig_cols  = [c for c in cols if c.startswith("MACDs_")]
            hist_cols = [c for c in cols if c.startswith("MACDh_")]
            if macd_cols:  df["macd"]        = macd_df[macd_cols[0]]
            if sig_cols:   df["macd_signal"] = macd_df[sig_cols[0]]
            if hist_cols:  df["macd_hist"]   = macd_df[hist_cols[0]]
    except Exception as e:
        logger.warning(f"MACD falhou: {e}")

    # ── Bollinger Bands ────────────────────────────────────────────────────
    try:
        bb = ta.bbands(close_series, length=20, std=2)
        if bb is not None:
            cols = bb.columns.tolist()
            upper = [c for c in cols if c.startswith("BBU_")]
            lower = [c for c in cols if c.startswith("BBL_")]
            width = [c for c in cols if c.startswith("BBB_")]
            if upper: df["bb_upper"] = bb[upper[0]]
            if lower: df["bb_lower"] = bb[lower[0]]
            if width: df["bb_width"] = bb[width[0]]
    except Exception as e:
        logger.warning(f"Bollinger Bands falhou: {e}")

    # ── ATR ────────────────────────────────────────────────────────────────
    try:
        df["atr"] = ta.atr(high_series, low_series, close_series, length=14)
    except Exception as e:
        logger.warning(f"ATR falhou: {e}")

    # ── ADX ────────────────────────────────────────────────────────────────
    try:
        adx_df = ta.adx(high_series, low_series, close_series, length=14)
        if adx_df is not None:
            adx_cols = [c for c in adx_df.columns if c.startswith("ADX_")]
            if adx_cols:
                df["adx"] = adx_df[adx_cols[0]]
    except Exception as e:
        logger.warning(f"ADX falhou: {e}")

    # ── Volume ─────────────────────────────────────────────────────────────
    try:
        if "volume" in df.columns and df["volume"].astype(float).sum() > 0:
            vol = df["volume"].astype(float)
            df["vol_ma20"]  = ta.sma(vol, length=20)
            df["vol_ratio"] = vol / df["vol_ma20"]
    except Exception as e:
        logger.warning(f"Volume ratio falhou: {e}")

    # ── Extração dos últimos valores ────────────────────────────────────────
    latest = df.iloc[-1]
    prev   = df.iloc[-2]

    def _v(col):
        return _safe_float(latest[col] if col in df.columns else None)

    def _p(col):
        return _safe_float(prev[col] if col in df.columns else None)

    close  = _safe_float(latest["close"]) or 0.0
    ema20  = _v("ema_20")
    ema50  = _v("ema_50")
    ema200 = _v("ema_200")

    # ── Tendência composta ─────────────────────────────────────────────────
    if ema20 and ema50 and ema200:
        if   close > ema20 > ema50 > ema200: trend = "STRONG_UP"
        elif close > ema20 and ema20 > ema50: trend = "UP"
        elif close < ema20 < ema50 < ema200: trend = "STRONG_DOWN"
        elif close < ema20 and ema20 < ema50: trend = "DOWN"
        else: trend = "SIDEWAYS"
    elif ema20 and ema50:
        trend = "UP" if ema20 > ema50 else "DOWN"
    else:
        trend = "UNKNOWN"

    # ── Detecção de sinais ─────────────────────────────────────────────────
    signals = []
    rsi_val    = _v("rsi")
    macd_val   = _v("macd")
    macd_sig   = _v("macd_signal")
    bb_upper   = _v("bb_upper")
    bb_lower   = _v("bb_lower")
    bb_width   = _v("bb_width")
    adx_val    = _v("adx")
    vol_ratio  = _v("vol_ratio")

    if rsi_val:
        if   rsi_val < 25: signals.append("RSI_EXTREME_OVERSOLD")
        elif rsi_val < 35: signals.append("RSI_OVERSOLD")
        elif rsi_val > 75: signals.append("RSI_EXTREME_OVERBOUGHT")
        elif rsi_val > 65: signals.append("RSI_OVERBOUGHT")

    p_macd = _p("macd");  p_sig = _p("macd_signal")
    if all(v is not None for v in [macd_val, macd_sig, p_macd, p_sig]):
        if macd_val > macd_sig and p_macd <= p_sig: signals.append("MACD_BULLISH_CROSS")
        elif macd_val < macd_sig and p_macd >= p_sig: signals.append("MACD_BEARISH_CROSS")
        signals.append("MACD_ABOVE_ZERO" if macd_val > 0 else "MACD_BELOW_ZERO")

    p_ema20 = _p("ema_20");  p_ema50 = _p("ema_50")
    if all(v is not None for v in [ema20, ema50, p_ema20, p_ema50]):
        if ema20 > ema50 and p_ema20 <= p_ema50: signals.append("GOLDEN_CROSS_20_50")
        elif ema20 < ema50 and p_ema20 >= p_ema50: signals.append("DEATH_CROSS_20_50")

    if bb_upper and bb_lower and close:
        if   close > bb_upper: signals.append("ABOVE_BB_UPPER")
        elif close < bb_lower: signals.append("BELOW_BB_LOWER")
        if bb_width and bb_width < 2.0: signals.append("BB_SQUEEZE")

    if adx_val:
        signals.append("STRONG_TREND" if adx_val > 25 else "WEAK_TREND_OR_RANGE")

    if vol_ratio:
        if   vol_ratio > 1.5: signals.append("HIGH_VOLUME")
        elif vol_ratio < 0.5: signals.append("LOW_VOLUME")

    return {
        "symbol":  symbol,
        "price":   close,
        "trend":   trend,
        "signals": signals,
        "indicators": {
            "rsi":         rsi_val,
            "macd":        macd_val,
            "macd_signal": macd_sig,
            "macd_hist":   _v("macd_hist"),
            "ema_9":       _v("ema_9"),
            "ema_20":      ema20,
            "ema_50":      ema50,
            "ema_200":     ema200,
            "bb_upper":    bb_upper,
            "bb_lower":    bb_lower,
            "bb_width":    bb_width,
            "atr":         _v("atr"),
            "adx":         adx_val,
            "stoch_k":     _v("stoch_k"),
            "stoch_d":     _v("stoch_d"),
            "vol_ratio":   vol_ratio,
        },
        "candles_loaded": len(df),
        "status": "success",
    }


# ─── Ferramentas do LangGraph ────────────────────────────────────────────────

@tool
def search_knowledge_base(query: str, category: str = None):
    """
    Consulta a base de conhecimento semântica (ChromaDB).
    Use para buscar estratégias, regras de gestão de risco, IR ou padrões gráficos nos PDFs indexados.
    Categorias disponíveis: 'crypto', 'stocks', 'strategy', 'macro', 'tax'.
    """
    return kb.search(query, category=category)


@tool
def get_crypto_price(symbol: str, timeframe: str = "1h", limit: int = 200):
    """
    Busca candles de um par de criptoativos na Binance (público, sem API key)
    e calcula um conjunto completo de indicadores técnicos.
    Exemplo de symbol: 'BTC/USDT', 'ETH/USDT'.
    Timeframes suportados: 1m, 5m, 15m, 1h, 4h, 1d.
    """
    try:
        exchange = ccxt.binance()
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
        df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
        return _calculate_indicators(df, symbol)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
def get_stock_price(symbol: str):
    """
    Busca cotação de ações brasileiras (B3) ou americanas via Yahoo Finance.
    Para B3, use o sufixo .SA (ex: 'PETR4.SA'). Para EUA, use o ticker (ex: 'AAPL').
    """
    try:
        url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbol}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        data = response.json()
        if data["quoteResponse"]["result"]:
            r = data["quoteResponse"]["result"][0]
            return {
                "symbol":         symbol,
                "name":           r.get("longName"),
                "price":          r.get("regularMarketPrice"),
                "change_percent": r.get("regularMarketChangePercent"),
                "currency":       r.get("currency"),
                "status":         "success",
            }
        return {"status": "error", "message": "Ativo não encontrado."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
def load_csv_chart(file_path: str, symbol: str = "UNKNOWN"):
    """
    Lê um CSV exportado do TradingView e calcula o conjunto completo de indicadores.
    Colunas esperadas: time, open, high, low, close, volume (volume opcional).
    O campo 'time' pode ser Unix timestamp (segundos) ou string datetime ISO.
    """
    try:
        df = pd.read_csv(file_path)
        df.columns = [c.lower().strip() for c in df.columns]

        if "time" in df.columns:
            col = df["time"]
            if pd.api.types.is_numeric_dtype(col):
                df["time"] = pd.to_datetime(col, unit="s", utc=True)
            else:
                df["time"] = pd.to_datetime(col, utc=True, errors="coerce")

        df = df.sort_values("time").reset_index(drop=True)
        return _calculate_indicators(df, symbol)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
def execute_trade_signal(symbol: str, side: str, amount: float, order_type: str = "market"):
    """
    PREPARA uma ordem de compra ou venda para validação humana.
    side: 'buy' ou 'sell'. order_type: 'market' ou 'limit'.
    Não executa nada — retorna os parâmetros formatados para aprovação manual.
    """
    return {
        "action":    "ORDER_PREPARATION",
        "symbol":    symbol,
        "side":      side,
        "amount":    amount,
        "type":      order_type,
        "timestamp": datetime.now().isoformat(),
        "status":    "AWAITING_CONFIRMATION",
    }


lux_tools = [search_knowledge_base, get_crypto_price, get_stock_price, load_csv_chart, execute_trade_signal]
