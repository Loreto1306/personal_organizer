# Roadmap Semântico: Agente Especialista em Criptoativos

Este documento detalha a visão estratégica, os objetivos de desenvolvimento e a arquitetura lógica para a criação de um agente autônomo de investimentos (Day Trade/Swing Trade) focado no ecossistema de criptomoedas.

## 1. Visão Geral e Objetivo
O objetivo é desenvolver um "Cérebro Digital" capaz de processar o mercado de criptoativos não apenas como números, mas como um contexto probabilístico. O agente deve ser capaz de:
- Identificar padrões gráficos e estatísticos.
- Validar sinais técnicos contra notícias e sentimento social em tempo real.
- Aplicar regras rígidas de gestão de risco baseadas em documentos de referência (RAG).
- Operar em um ciclo de feedback contínuo (Estado) para evitar decisões impulsivas.

---

## 2. Pilares Tecnológicos (Stack Selecionada)

### A. Motor Cognitivo: Theia-Llama-3.1-8B-v1
- **Porquê:** Baseado no Llama 3.1, oferece raciocínio lógico superior e foi treinado especificamente com jargões, narrativas e dados do mercado Cripto/Web3.
- **Função:** Juiz final e analista de contexto.

### B. Orquestrador de Estado: LangGraph
- **Porquê:** Permite a criação de fluxos cíclicos e persistência de memória (State).
- **Função:** Gerir o "pensamento" do agente, permitindo que ele volte atrás, refine análises ou aguarde confirmações antes de agir.

### C. Camada de Especialista: Agentic RAG (ChromaDB)
- **Porquê:** Injeta conhecimento técnico e estatístico sem "congelar" o modelo.
- **Função:** Fornecer as diretrizes de tomada de decisão e probabilidades históricas que o agente deve respeitar.

### D. Ferramentas Sensoriais (Braços de Execução)
- **Análise Quantitativa:** `CCXT` (Conexão com Exchanges) + `pandas_ta` (Matemática de indicadores).
- **Contexto de Mundo:** `CryptoPanic API` (Notícias) + `Tavily API` (Busca profunda) + `LunarCrush` (Sentimento social).

---

## 3. Fases de Desenvolvimento

### Fase 1: Fundação do Estado (State Definition)
Definição das variáveis de memória que o agente carregará. O foco não é o trade em si, mas a estrutura de dados (Preço, RSI, Notícias, Probabilidade RAG, Decisão) que flui entre os nós do grafo.

### Fase 2: Implementação de Ferramentas (Tooling)
Desenvolvimento de funções Python isoladas que extraem dados brutos. O objetivo aqui é a "Visão": transformar o caos dos dados de mercado em JSONs estruturados que o LLM consiga interpretar.

### Fase 3: Vetorização de Conhecimento (RAG Integration)
Processamento dos manuais de estratégia. O objetivo é criar um sistema onde o agente, ao detectar um cenário, pergunte ao banco de dados: "O que a minha estratégia diz sobre este padrão específico?".

### Fase 4: Construção do Grafo de Decisão (Logic Nodes)
Montagem dos nós do LangGraph:
1. **Nó de Observação:** Coleta dados.
2. **Nó de Verificação:** Consulta RAG e Notícias.
3. **Nó de Reflexão:** O Theia-Llama avalia se todos os critérios batem.
4. **Nó de Saída:** Gera a ordem ou o alerta de segurança.

### Fase 5: Validação e Backtesting Simulado
Execução do agente em ambiente de teste (Paper Trading). O objetivo é ajustar o "tom" das decisões e garantir que a gestão de risco (Stop Loss/Take Profit) seja aplicada com 100% de rigor.

---

## 4. Diferenciais da Abordagem
- **Independência de Visão Computacional:** O agente lê a matemática do gráfico, não o pixel, o que aumenta a precisão e reduz a latência.
- **Resiliência a Notícias:** Filtro obrigatório de notícias antes de qualquer entrada, protegendo contra "pumps" artificiais.
- **Human-in-the-Loop:** Capacidade nativa de pausar para aprovação manual do utilizador antes de operações críticas.