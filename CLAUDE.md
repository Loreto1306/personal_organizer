# CLAUDE.md — Lux System / Crypto Agent

> Guia de contexto e plano de trabalho para o Claude Code.
> Mantenha este arquivo atualizado a cada marco concluído.

---

## 1. Identidade do projeto

**Lux System** é um ecossistema pessoal de produtividade + investimentos com três blocos interdependentes:

| Camada | Stack | Pasta | Status |
|---|---|---|---|
| **Frontend** | React 19 + Vite + Tailwind (Glass Bento UI) | `organizer/frontend` | Operacional |
| **Backend (organizer)** | Node.js + Express + better-sqlite3 | `organizer/backend` | Operacional (tasks, objectives, finance, assets) |
| **Agente Cripto (Lux AI)** | Python + FastAPI + LangGraph + ChromaDB | `organizer/app` | Esqueleto pronto, **sofrendo travamentos** |
| **Bot Minecraft (experimento isolado)** | mineflayer + Python orquestrador | `organizer/bot` | Não relacionado ao agente financeiro |

O frontend já tem a aba **Co-Pilot** (`ChatView.jsx`) que conversa com `http://localhost:8000/chat`. O backend Express roda na `:3001` e o agente Python na `:8000`. Toda integração ponta-a-ponta já existe — falta tornar o cérebro do agente **estável e inteligente**.

---

## 2. Diagnóstico do "travamento" atual

O agente em `organizer/app/agent/nodes.py` carrega `Theia-Llama-3.1-8B-v1` via `transformers` + `bitsandbytes` 4-bit. Em hardware **RTX 4060 8GB VRAM + 16GB RAM (Windows)** isso é exatamente a receita do trava-tela:

1. **bitsandbytes no Windows** é instável e tem overhead alto.
2. Modelo (~5GB) + KV cache + ativações + embeddings (`MiniLM`) + FastAPI + scheduler vivem **no mesmo processo** — pico fácil de 7-8GB de VRAM. Quando excede, faz spill para RAM e congela.
3. `HuggingFacePipeline` não libera memória entre chamadas; a cada `ainvoke` o uso só sobe.
4. `MiniLM-L6-v2` é **só inglês** — ruim para PDFs e livros em PT-BR.
5. `.env` tem `HF_TOKEN` exposto. **Rotacionar e mover para fora do repo** assim que possível.

---

## 3. Arquitetura-alvo (Fase 1)

> **Decisões já tomadas pelo usuário (2026-05-09):**
> - Modo de visão = **matemática** (OHLCV + indicadores). Vision via screenshot fica para Fase 2.
> - Runtime LLM = **Ollama** (daemon separado, gerencia VRAM, libera quando ocioso).
> - Fonte de dados = **CSVs exportados** da plataforma de trading do usuário (não mais ccxt como única fonte).

### Stack recomendada

| Componente | Escolha | Footprint VRAM | Por quê |
|---|---|---|---|
| **LLM principal** | `qwen2.5:7b-instruct-q4_K_M` via Ollama | ~4.7 GB | Melhor PT-BR + raciocínio numérico/finance dos modelos 7B abertos. Cabe folgado. |
| **LLM alternativo** | `llama3.1:8b-instruct-q4_K_M` | ~4.9 GB | Base do Theia. Mantém familiaridade se quiser comparar. |
| **LLM stretch** | `qwen2.5:14b-instruct-q4_K_M` | ~8.5 GB | Aperta os 8GB, exige `num_ctx` reduzido. Só se 7B não der conta da análise. |
| **Embeddings** | `BAAI/bge-m3` (via HuggingFace) ou `nomic-embed-text` (via Ollama) | ~2 GB ou CPU | Multilingual, dense+sparse. **Substitui o MiniLM**. |
| **Reranker (opcional, fase 1.5)** | `BAAI/bge-reranker-v2-m3` | ~600 MB | Aumenta drasticamente a precisão do RAG sobre livros. |
| **Vector DB** | ChromaDB (já em uso) | — | Manter. |
| **Orquestração** | LangGraph (já em uso) | — | Manter. |

### Por que isso resolve os travamentos

- Ollama roda como **daemon separado**: o FastAPI faz HTTP, não segura GPU.
- GGUF Q4_K_M é **muito mais eficiente** que bitsandbytes-4bit no Windows.
- LLM e embeddings **não competem mais pelo mesmo processo Python**.
- Quando o `interval=10s` do scheduler estiver ocioso, o Ollama libera VRAM sozinho.

### Fluxo de dados (Fase 1)

```
CSV (plataforma de trading)  ──►  pandas + pandas_ta (indicadores)
                                         │
                                         ▼
                              AgentState (LangGraph)
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
         get_market_indicators   search_knowledge_base    get_news (futuro)
                                  (BGE-M3 + Chroma)
                                         │
                                         ▼
                               reflection_node (Qwen2.5 via Ollama)
                                         │
                                         ▼
                               output_node → FastAPI → ChatView
```

---

## 4. Plano de execução (próximas tarefas)

### Fase 1 — Estabilização do cérebro (PRIORIDADE)

- [x] **1.1** Ollama rodando. Modelo disponível: `qwen3:8b-q4_K_M` (~5.2 GB).
- [x] **1.2** `langchain-ollama` — instalar se ainda não estiver: `pip install langchain-ollama`.
- [x] **1.3** `nodes.py` refatorado: sem `transformers`/`bitsandbytes`; usa `ChatOllama(model="qwen3:8b-q4_K_M", temperature=0.1, num_ctx=8192, options={"think": False})`. Thinking mode desativado.
- [x] **1.4** `knowledge_base.py` refatorado: `MiniLM-L6-v2` → `BAAI/bge-m3` (multilingual PT-BR). Adicionado `ingest_directory()` para batch.
- [ ] **1.5** ⚠️ ChromaDB DEVE ser limpo (`db/chroma` apagado) antes da primeira ingestão — embeddings mudaram de 384 para 1024 dimensões (incompatível).
- [ ] **1.6** Remover `HF_TOKEN` do `.env` versionado, rotacionar token, adicionar `.env` ao `.gitignore`.
- [ ] **1.7** Reduzir `scheduler` em `main.py` de `seconds=10` para `minutes=15` (em produção).
- [ ] **1.8** Testar agente: `python test_agent.py` — verificar se Ollama responde e o grafo termina sem erro.

### Fase 1.5 — Ingestão de conhecimento

- [ ] **2.1** Criar pasta `organizer/app/knowledge/` para PDFs de livros e consultas.
- [ ] **2.2** Adaptar `ingest_knowledge.py` para batch (varrer pasta inteira em vez de prompt interativo).
- [ ] **2.3** Adicionar metadados ricos por categoria: `crypto`, `stocks`, `fixed_income`, `tax_rules`, `strategy`, `macro`.
- [ ] **2.4** (Opcional) Adicionar reranker BGE-reranker-v2-m3 via `ContextualCompressionRetriever`.

### Fase 1.6 — Pipeline de CSV (substitui parte do ccxt)

- [x] **3.1** Tool `load_csv_chart` em `tools.py`: lê CSV do TradingView (Unix ts ou ISO), calcula RSI/EMA20/EMA50/MACD/Bollinger, detecta sinais.
- [x] **3.2** Schema TradingView: `time, open, high, low, close, volume` (volume opcional). Timestamp Unix (s) ou string ISO.
- [x] **3.3** `observation_node` com prioridade: `csv_path` no state → CSV em `data/` (mais recente por símbolo) → ccxt.
- [x] **3.4** `state.py` com campo `csv_path: Optional[str]`.
- [x] **3.5** Endpoint `POST /analyze-csv` (multipart) em `main.py`: salva em `data/`, executa grafo, retorna análise + indicadores.
- [x] **3.6** `ChatView.jsx` com botão paperclip para upload de CSV + campo de símbolo inline.
- [x] **3.7** `api.js` com `agentService.analyzeCSV(file, symbol, message)`.

### Fase 2 — Visão computacional (DEPOIS da Fase 1 estar estável)

- [ ] **4.1** Adicionar suporte a screenshot via VLM (`qwen2.5vl:7b` em Ollama, ~6GB VRAM).
- [ ] **4.2** Estratégia de descarregamento: rodar VLM **sob demanda** e descarregar o LLM principal para caber nos 8GB. Alternativa: usar VLM menor (`minicpm-v` ~5GB).
- [ ] **4.3** Endpoint `/analyze-chart-image` no FastAPI; ChatView aceita upload de imagem.

### Fase 3 — Camadas avançadas (roadmap original do usuário)

- [ ] Notícias e sentimento (CryptoPanic, LunarCrush, Tavily) — já no roadmap_cripto_agent.md.
- [ ] Backtesting / Paper trading.
- [ ] Human-in-the-loop antes de ordens reais.
- [ ] Persistência de decisões do agente no SQLite do backend (auditoria).

---

## 5. Ambiente e convenções

- **Python**: o usuário gerencia o venv e dependências manualmente — **não rodar `pip install` por conta própria**.
- **ChromaDB**: existe em `organizer/app/agent/db/chroma`, está vazio por enquanto.
- **Plataforma**: Windows 11 + PowerShell. Use sintaxe PowerShell, não bash.
- **Idioma**: o usuário trabalha em PT-BR. Respostas técnicas podem usar termos em inglês, mas explicações em PT-BR.
- **Estética do código frontend**: já tem identidade visual fechada (Glass Bento, `glass-minimal`, `font-black italic uppercase tracking-tighter`). Ao mexer em UI, manter o padrão.

---

## 6. Arquivos-chave para releitura rápida

| Quando mexer em... | Ler primeiro |
|---|---|
| Lógica do agente | `organizer/app/agent/graph.py`, `nodes.py`, `state.py` |
| Ferramentas (mercado, RAG) | `organizer/app/agent/tools.py`, `knowledge_base.py` |
| API do agente | `organizer/app/main.py` |
| Estratégia/regras | `organizer/app/agent/strategy.md` |
| Chat UI | `organizer/frontend/src/components/ChatView.jsx` |
| Integração frontend↔agente | `organizer/frontend/src/lib/api.js` (`agentService`) |
| Backend organizer | `organizer/backend/src/index.js`, `db.js`, `routes/*.js` |
| Visão de longo prazo | `roadmap_cripto_agent.md`, `GEMINI.md` |

---

## 7. Histórico de decisões

- **2026-05-09** — Decidido migrar de `transformers + bitsandbytes` → **Ollama + Qwen2.5-7B** para resolver travamentos. Embeddings migram de `MiniLM` → `BGE-M3` para suportar PT-BR. Vision/screenshot fica para Fase 2; Fase 1 usa CSV + indicadores numéricos.
