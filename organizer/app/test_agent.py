import asyncio
from agent.graph import crypto_agent

async def test_run():
    print("🚀 Iniciando Teste do Agente Cripto (LangGraph)...")
    
    # Estado inicial de teste
    test_state = {
        "symbol": "BTC/USDT",
        "timeframe": "1h",
        "messages": []
    }
    
    try:
        # Executa o grafo
        print(f"🔍 Analisando {test_state['symbol']}...")
        result = await crypto_agent.ainvoke(test_state)
        
        print("\n" + "="*50)
        print("📊 RELATÓRIO DE EXECUÇÃO")
        print("="*50)
        print(f"Ativo:      {result.get('symbol')}")
        print(f"Preço:      {result.get('latest_price')}")
        print(f"RSI:        {result.get('rsi')}")
        print(f"Sentimento: {result.get('market_sentiment')}")
        print(f"Decisão:    {result.get('decision')}")
        print(f"Confiança:  {result.get('confidence')}")
        print(f"Razão:      {result.get('reasoning')}")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        print("\nCertifique-se de que o Ollama está rodando com o modelo 'theia-llama-3.1-8b'.")

if __name__ == "__main__":
    asyncio.run(test_run())
